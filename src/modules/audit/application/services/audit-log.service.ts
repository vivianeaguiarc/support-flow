import type { AuditLog, Prisma } from '@prisma/client';

import { logger } from '../../../../shared/logger/logger.js';
import { metricsService } from '../../../observability/application/metrics.service.js';
import { computeAuditHash } from '../../domain/audit-hash.js';
import {
  type AppendAuditLogInput,
  AuditLogRepository,
  auditLogRepository as defaultAuditLogRepository,
} from '../../infrastructure/repositories/audit-log.repository.js';

export type RecordAuditInput = AppendAuditLogInput;

export type AuditChainStatus = 'VALID' | 'BROKEN' | 'EMPTY';

export type AuditChainInvalidRecord = {
  id: string;
  sequence: string;
  action: string;
  entity: string;
  reason: 'PREVIOUS_HASH_MISMATCH' | 'HASH_MISMATCH';
  expectedHash: string;
  storedHash: string;
};

export type AuditChainVerification = {
  status: AuditChainStatus;
  valid: boolean;
  totalVerified: number;
  firstInvalid: AuditChainInvalidRecord | null;
};

/**
 * Application service for the immutable audit trail.
 *
 * Writes are best-effort: a failure to persist an audit record must never break
 * the business operation that triggered it. Failures are logged with structured
 * context so they can be alerted on. Because failed appends are never written,
 * the hash chain itself stays consistent (a missing entry does not corrupt it).
 */
export class AuditLogService {
  constructor(
    private readonly repository: AuditLogRepository = defaultAuditLogRepository,
  ) {}

  async record(
    input: RecordAuditInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    try {
      await this.repository.append(input, tx);
      metricsService.recordAuditWritten();
    } catch (error: unknown) {
      logger.error(
        {
          err: error,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId ?? null,
        },
        'audit.log.write_failed',
      );
    }
  }

  async verifyChain(): Promise<AuditChainVerification> {
    const records = await this.repository.listOrderedForVerification();

    if (records.length === 0) {
      metricsService.setAuditChainBroken(false);
      return {
        status: 'EMPTY',
        valid: true,
        totalVerified: 0,
        firstInvalid: null,
      };
    }

    let previousHash: string | null = null;

    for (const [index, record] of records.entries()) {
      const expectedHash = this.recomputeHash(record, previousHash);

      if ((record.previousHash ?? null) !== previousHash) {
        return this.fail(record, index, previousHash, expectedHash, true);
      }

      if (record.hash !== expectedHash) {
        return this.fail(record, index, previousHash, expectedHash, false);
      }

      previousHash = record.hash;
    }

    metricsService.setAuditChainBroken(false);

    return {
      status: 'VALID',
      valid: true,
      totalVerified: records.length,
      firstInvalid: null,
    };
  }

  private recomputeHash(record: AuditLog, previousHash: string | null): string {
    return computeAuditHash({
      organizationId: record.organizationId,
      userId: record.userId,
      action: record.action,
      entity: record.entity,
      entityId: record.entityId,
      oldValues: record.oldValues,
      newValues: record.newValues,
      metadata: record.metadata,
      createdAt: record.createdAt,
      previousHash,
    });
  }

  private fail(
    record: AuditLog,
    index: number,
    previousHash: string | null,
    expectedHash: string,
    previousHashMismatch: boolean,
  ): AuditChainVerification {
    const reason = previousHashMismatch
      ? 'PREVIOUS_HASH_MISMATCH'
      : 'HASH_MISMATCH';

    metricsService.setAuditChainBroken(true);

    logger.error(
      {
        auditLogId: record.id,
        sequence: record.sequence.toString(),
        action: record.action,
        entity: record.entity,
        reason,
        expectedPreviousHash: previousHash,
        storedPreviousHash: record.previousHash,
        expectedHash,
        storedHash: record.hash,
      },
      'audit.chain.integrity_violation',
    );

    return {
      status: 'BROKEN',
      valid: false,
      totalVerified: index,
      firstInvalid: {
        id: record.id,
        sequence: record.sequence.toString(),
        action: record.action,
        entity: record.entity,
        reason,
        expectedHash,
        storedHash: record.hash,
      },
    };
  }
}

export const auditLogService = new AuditLogService();
