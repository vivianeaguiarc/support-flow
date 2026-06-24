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

export type ListAuditLogsFilters = {
  organizationId?: string;
  userId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
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
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where: Prisma.AuditLogWhereInput = {
      ...(filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.entity ? { entity: filters.entity } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { sequence: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
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
