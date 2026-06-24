import type { AuditLog } from '@prisma/client';

import {
  AuditLogRepository,
  auditLogRepository as defaultAuditLogRepository,
  type ListAuditLogsFilters,
} from '../../infrastructure/repositories/audit-log.repository.js';
import {
  type AuditChainVerification,
  AuditLogService,
  auditLogService as defaultAuditLogService,
} from './audit-log.service.js';

export type AuditLogView = {
  id: string;
  sequence: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: unknown;
  newValues: unknown;
  metadata: unknown;
  previousHash: string | null;
  hash: string;
  createdAt: string;
};

export class AuditAdminService {
  constructor(
    private readonly repository: AuditLogRepository = defaultAuditLogRepository,
    private readonly service: AuditLogService = defaultAuditLogService,
  ) {}

  async list(filters: ListAuditLogsFilters): Promise<{
    data: AuditLogView[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.repository.list(filters);

    return {
      data: result.data.map((log) => this.toView(log)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async verify(): Promise<AuditChainVerification> {
    return this.service.verifyChain();
  }

  private toView(log: AuditLog): AuditLogView {
    return {
      id: log.id,
      sequence: log.sequence.toString(),
      organizationId: log.organizationId,
      userId: log.userId,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      oldValues: log.oldValues ?? null,
      newValues: log.newValues ?? null,
      metadata: log.metadata ?? null,
      previousHash: log.previousHash,
      hash: log.hash,
      createdAt: log.createdAt.toISOString(),
    };
  }
}

export const auditAdminService = new AuditAdminService();
