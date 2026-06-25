import type { AuditLog } from '@prisma/client';

import {
  type PaginatedResult,
  toPaginatedResult,
} from '../../../../shared/http/pagination/pagination.js';
import {
  AuditLogRepository,
  auditLogRepository as defaultAuditLogRepository,
  type ListAuditLogsFilters,
} from '../../infrastructure/repositories/audit-log.repository.js';
import {
  type AuditChainInvalidRecord,
  type AuditChainStatus,
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
  ip: string | null;
  requestId: string | null;
  oldValues: unknown;
  newValues: unknown;
  metadata: unknown;
  previousHash: string | null;
  hash: string;
  createdAt: string;
};

export type AuditIntegrityStatus = 'INTACT' | 'EMPTY' | 'COMPROMISED';

export type AuditIntegrityVerificationView = {
  status: AuditIntegrityStatus;
  totalLogs: number;
  checkedAt: string;
  firstLogId: string | null;
  lastLogId: string | null;
  compromisedLogId: string | null;
  message: string;
  // Backward-compatible fields kept from the previous contract.
  chainStatus: AuditChainStatus;
  valid: boolean;
  totalVerified: number;
  firstInvalid: AuditChainInvalidRecord | null;
};

export class AuditAdminService {
  constructor(
    private readonly repository: AuditLogRepository = defaultAuditLogRepository,
    private readonly service: AuditLogService = defaultAuditLogService,
  ) {}

  async list(
    filters: ListAuditLogsFilters,
  ): Promise<PaginatedResult<AuditLogView>> {
    const result = await this.repository.list(filters);

    return toPaginatedResult(
      result.data.map((log) => this.toView(log)),
      result.page,
      result.limit,
      result.total,
    );
  }

  async verify(): Promise<AuditIntegrityVerificationView> {
    const [chain, totalLogs, boundaries] = await Promise.all([
      this.service.verifyChain(),
      this.repository.count(),
      this.repository.getBoundaryLogIds(),
    ]);

    const status = this.toIntegrityStatus(chain.status);
    const compromisedLogId = chain.firstInvalid?.id ?? null;

    return {
      status,
      totalLogs,
      checkedAt: new Date().toISOString(),
      firstLogId: boundaries.firstLogId,
      lastLogId: boundaries.lastLogId,
      compromisedLogId,
      message: this.buildMessage(status, totalLogs, compromisedLogId),
      chainStatus: chain.status,
      valid: chain.valid,
      totalVerified: chain.totalVerified,
      firstInvalid: chain.firstInvalid,
    };
  }

  private toIntegrityStatus(status: AuditChainStatus): AuditIntegrityStatus {
    if (status === 'EMPTY') {
      return 'EMPTY';
    }

    return status === 'VALID' ? 'INTACT' : 'COMPROMISED';
  }

  private buildMessage(
    status: AuditIntegrityStatus,
    totalLogs: number,
    compromisedLogId: string | null,
  ): string {
    if (status === 'EMPTY') {
      return 'No audit logs to verify.';
    }

    if (status === 'COMPROMISED') {
      return `Audit chain integrity compromised at log ${compromisedLogId}.`;
    }

    return `Audit chain is intact. ${totalLogs} log(s) verified.`;
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
      ip: this.extractMetadataString(log.metadata, ['ip', 'ipAddress']),
      requestId: this.extractMetadataString(log.metadata, ['requestId']),
      oldValues: log.oldValues ?? null,
      newValues: log.newValues ?? null,
      metadata: log.metadata ?? null,
      previousHash: log.previousHash,
      hash: log.hash,
      createdAt: log.createdAt.toISOString(),
    };
  }

  /**
   * Maps non-sensitive observability fields (ip / requestId) from the metadata
   * JSON to the top of the response when they were collected. Never invents
   * values: returns null when absent.
   */
  private extractMetadataString(
    metadata: unknown,
    keys: string[],
  ): string | null {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return null;
    }

    const record = metadata as Record<string, unknown>;

    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return null;
  }
}

export const auditAdminService = new AuditAdminService();
