import type { Prisma } from '@prisma/client';

import type { DomainEvent } from '../../../../shared/events/domain-event.js';
import {
  OutboxRepository,
  outboxRepository as defaultOutboxRepository,
} from '../../infrastructure/repositories/outbox.repository.js';

export class OutboxService {
  constructor(
    private readonly repository: OutboxRepository = defaultOutboxRepository,
  ) {}

  async enqueueInTransaction(
    event: DomainEvent,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await this.repository.createFromDomainEvent(event, tx);
  }

  async recordSideEffect(input: {
    eventName: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    await this.repository.createProcessedSideEffect(input);
  }
}

export const outboxService = new OutboxService();
