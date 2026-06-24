import type { AuditLog } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../observability/application/metrics.service.js', () => ({
  metricsService: {
    recordAuditWritten: vi.fn(),
    setAuditChainBroken: vi.fn(),
  },
}));

import { computeAuditHash } from '../../domain/audit-hash.js';
import type {
  AppendAuditLogInput,
  AuditLogRepository,
} from '../../infrastructure/repositories/audit-log.repository.js';
import { AuditLogService } from './audit-log.service.js';

/**
 * Minimal in-memory implementation of the append-only repository that performs
 * real hash chaining, so the service tests cover end-to-end chain semantics.
 */
class InMemoryAuditLogRepository {
  public readonly records: AuditLog[] = [];
  private sequence = 0n;

  async append(input: AppendAuditLogInput): Promise<AuditLog> {
    const last = this.records[this.records.length - 1];
    const previousHash = last?.hash ?? null;
    const createdAt = new Date('2026-06-25T10:00:00.000Z');

    const organizationId = input.organizationId ?? null;
    const userId = input.userId ?? null;
    const entityId = input.entityId ?? null;
    const oldValues = (input.oldValues ?? null) as AuditLog['oldValues'];
    const newValues = (input.newValues ?? null) as AuditLog['newValues'];
    const metadata = (input.metadata ?? null) as AuditLog['metadata'];

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

    this.sequence += 1n;
    const record: AuditLog = {
      id: `audit-${this.sequence}`,
      sequence: this.sequence,
      organizationId,
      userId,
      action: input.action,
      entity: input.entity,
      entityId,
      oldValues,
      newValues,
      metadata,
      previousHash,
      hash,
      createdAt,
    };

    this.records.push(record);
    return record;
  }

  async listOrderedForVerification(): Promise<AuditLog[]> {
    return [...this.records];
  }

  async count(): Promise<number> {
    return this.records.length;
  }
}

function createService() {
  const repository = new InMemoryAuditLogRepository();
  const service = new AuditLogService(
    repository as unknown as AuditLogRepository,
  );
  return { repository, service };
}

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('chains each new record to the previous hash', async () => {
    const { repository, service } = createService();

    await service.record({
      action: 'ticket.created',
      entity: 'ticket',
      entityId: 't1',
    });
    await service.record({
      action: 'ticket.assigned',
      entity: 'ticket',
      entityId: 't1',
    });

    expect(repository.records).toHaveLength(2);
    expect(repository.records[0].previousHash).toBeNull();
    expect(repository.records[1].previousHash).toBe(repository.records[0].hash);
  });

  it('verifies a valid chain', async () => {
    const { service } = createService();

    await service.record({ action: 'role.created', entity: 'role' });
    await service.record({ action: 'role.updated', entity: 'role' });
    await service.record({ action: 'role.deleted', entity: 'role' });

    const result = await service.verifyChain();

    expect(result.status).toBe('VALID');
    expect(result.valid).toBe(true);
    expect(result.totalVerified).toBe(3);
    expect(result.firstInvalid).toBeNull();
  });

  it('reports EMPTY status when there are no records', async () => {
    const { service } = createService();

    const result = await service.verifyChain();

    expect(result.status).toBe('EMPTY');
    expect(result.valid).toBe(true);
    expect(result.totalVerified).toBe(0);
  });

  it('detects a tampered record (hash mismatch)', async () => {
    const { repository, service } = createService();

    await service.record({ action: 'ticket.created', entity: 'ticket' });
    await service.record({ action: 'ticket.assigned', entity: 'ticket' });
    await service.record({ action: 'ticket.resolved', entity: 'ticket' });

    // Tamper with the stored content of the second record without recomputing.
    repository.records[1].action = 'ticket.hijacked';

    const result = await service.verifyChain();

    expect(result.valid).toBe(false);
    expect(result.status).toBe('BROKEN');
    expect(result.totalVerified).toBe(1);
    expect(result.firstInvalid?.id).toBe(repository.records[1].id);
    expect(result.firstInvalid?.reason).toBe('HASH_MISMATCH');
  });

  it('detects a broken link (previousHash mismatch)', async () => {
    const { repository, service } = createService();

    await service.record({ action: 'role.created', entity: 'role' });
    await service.record({ action: 'role.updated', entity: 'role' });

    repository.records[1].previousHash = 'forged-previous-hash';

    const result = await service.verifyChain();

    expect(result.valid).toBe(false);
    expect(result.firstInvalid?.reason).toBe('PREVIOUS_HASH_MISMATCH');
  });

  it('never throws when the repository fails', async () => {
    const repository = {
      append: vi.fn().mockRejectedValue(new Error('db down')),
    } as unknown as AuditLogRepository;
    const service = new AuditLogService(repository);

    await expect(
      service.record({ action: 'ticket.created', entity: 'ticket' }),
    ).resolves.toBeUndefined();
  });
});
