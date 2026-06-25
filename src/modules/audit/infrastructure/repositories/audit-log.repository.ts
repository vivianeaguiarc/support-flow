import type { AuditLog, Prisma } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import { computeAuditHash } from '../../domain/audit-hash.js';

export type AppendAuditLogInput = {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  metadata?: unknown;
};

export type AuditLogSortBy = 'createdAt' | 'action' | 'entity' | 'userId';

export type ListAuditLogsFilters = {
  organizationId?: string;
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: AuditLogSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

/**
 * Append-only repository for the immutable audit trail.
 *
 * It deliberately exposes ONLY creation and read operations — there are no
 * update or delete methods. Combined with the database trigger
 * (`prevent_audit_log_mutation`), audit records cannot be altered or removed.
 */
export class AuditLogRepository {
  /**
   * In-process serialization of appends. The chain requires "read latest hash →
   * insert" to be atomic; serializing within the process keeps it linear without
   * holding long database locks. When an external transaction is supplied, the
   * caller owns atomicity, so the serialization tail is awaited but the work runs
   * inside the provided client.
   */
  private appendChain: Promise<unknown> = Promise.resolve();

  async append(
    input: AppendAuditLogInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AuditLog> {
    // Standalone appends run on the shared client (connections are returned to
    // the pool between queries); the in-process mutex keeps read+insert atomic.
    // When an external transaction is supplied, the caller owns atomicity.
    const run = () => this.appendWithClient(input, tx ?? prisma);

    const result = this.appendChain.then(run, run);
    // Keep the chain alive regardless of individual failures.
    this.appendChain = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private async appendWithClient(
    input: AppendAuditLogInput,
    client: Prisma.TransactionClient,
  ): Promise<AuditLog> {
    const last = await client.auditLog.findFirst({
      orderBy: { sequence: 'desc' },
      select: { hash: true },
    });

    const previousHash = last?.hash ?? null;
    const createdAt = new Date();

    const organizationId = input.organizationId ?? null;
    const userId = input.userId ?? null;
    const entityId = input.entityId ?? null;
    const oldValues = input.oldValues ?? null;
    const newValues = input.newValues ?? null;
    const metadata = input.metadata ?? null;

    const hash = computeAuditHash({
      organizationId,
      userId,
      action: input.action,
      entity: input.entity,
      entityId,
      oldValues,
      newValues,
      metadata,
      createdAt,
      previousHash,
    });

    return client.auditLog.create({
      data: {
        organizationId,
        userId,
        action: input.action,
        entity: input.entity,
        entityId,
        oldValues: (oldValues ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        newValues: (newValues ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        previousHash,
        hash,
        createdAt,
      },
    });
  }

  async list(
    filters: ListAuditLogsFilters,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    // Coerce defensively: Express 5 exposes req.query as a getter, so the
    // numeric coercion applied during request validation does not always
    // persist by the time it reaches this layer.
    const page = this.toPositiveInt(filters.page, 1);
    const limit = Math.min(this.toPositiveInt(filters.limit, 20), 100);
    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'desc';

    const where = this.buildWhere(filters);

    // Only safe, whitelisted columns reach `sortBy`; an explicit sequence
    // tiebreaker keeps pagination deterministic when the primary key collides.
    const orderBy: Prisma.AuditLogOrderByWithRelationInput[] = [
      { [sortBy]: sortOrder } as Prisma.AuditLogOrderByWithRelationInput,
      { sequence: 'desc' },
    ];

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1
      ? Math.floor(parsed)
      : fallback;
  }

  private buildWhere(filters: ListAuditLogsFilters): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    };

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {
        ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
        ...(filters.createdTo ? { lte: filters.createdTo } : {}),
      };
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
        // ip / requestId are stored inside the metadata JSON (when collected).
        { metadata: { path: ['requestId'], string_contains: search } },
        { metadata: { path: ['ip'], string_contains: search } },
        { metadata: { path: ['ipAddress'], string_contains: search } },
      ];
    }

    return where;
  }

  /**
   * Returns the ids of the first and last records in chain order. Used by the
   * integrity verification response. Read-only.
   */
  async getBoundaryLogIds(): Promise<{
    firstLogId: string | null;
    lastLogId: string | null;
  }> {
    const [first, last] = await Promise.all([
      prisma.auditLog.findFirst({
        orderBy: { sequence: 'asc' },
        select: { id: true },
      }),
      prisma.auditLog.findFirst({
        orderBy: { sequence: 'desc' },
        select: { id: true },
      }),
    ]);

    return {
      firstLogId: first?.id ?? null,
      lastLogId: last?.id ?? null,
    };
  }

  /**
   * Returns every record in chain order (ascending sequence) so the chain can be
   * verified end to end.
   */
  async listOrderedForVerification(): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { sequence: 'asc' },
    });
  }

  async count(): Promise<number> {
    return prisma.auditLog.count();
  }
}

export const auditLogRepository = new AuditLogRepository();
