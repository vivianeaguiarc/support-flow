import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../observability/application/metrics.service.js', () => ({
  metricsService: {
    recordOutboxProcessed: vi.fn(),
    recordOutboxFailed: vi.fn(),
    refreshOutboxPendingGauge: vi.fn().mockResolvedValue(undefined),
  },
}));

import { DomainEventName } from '../../../../shared/events/domain-event-names.js';
import type { EventBus } from '../../../../shared/events/event-bus.js';
import { OutboxEventStatus } from '../../domain/outbox-event-status.js';
import type { OutboxRepository } from '../../infrastructure/repositories/outbox.repository.js';
import { OutboxRelayService } from './outbox-relay.service.js';

describe('OutboxRelayService', () => {
  it('publishes domain events to the event bus and marks processed', async () => {
    const repository: OutboxRepository = {
      findPendingBatch: vi.fn(),
      claimForProcessing: vi.fn().mockResolvedValue({
        id: 'outbox-1',
        eventName: DomainEventName.TICKET_CREATED,
        aggregateId: 'ticket-1',
        payload: {
          eventId: 'event-1',
          eventName: DomainEventName.TICKET_CREATED,
          aggregateId: 'ticket-1',
          occurredAt: new Date().toISOString(),
          payload: { tenantId: 'tenant-1' },
        },
        status: OutboxEventStatus.PROCESSING,
        attempts: 0,
        createdAt: new Date(),
        processedAt: null,
      }),
      markProcessed: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn(),
      markPendingForRetry: vi.fn(),
      createFromDomainEvent: vi.fn(),
      createProcessedSideEffect: vi.fn(),
      resetStuckProcessing: vi.fn(),
      list: vi.fn(),
      countByStatus: vi.fn(),
      findById: vi.fn(),
    };

    const eventBus: EventBus = {
      subscribe: vi.fn(),
      publish: vi.fn().mockResolvedValue(undefined),
    };

    const service = new OutboxRelayService(repository, eventBus);

    await service.processEvent('outbox-1');

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: DomainEventName.TICKET_CREATED,
        aggregateId: 'ticket-1',
      }),
    );
    expect(repository.markProcessed).toHaveBeenCalledWith('outbox-1');
  });

  it('schedules retry when processing fails before max attempts', async () => {
    const repository: OutboxRepository = {
      findPendingBatch: vi.fn(),
      claimForProcessing: vi.fn().mockResolvedValue({
        id: 'outbox-2',
        eventName: DomainEventName.TICKET_ASSIGNED,
        aggregateId: 'ticket-2',
        payload: {
          eventId: 'event-2',
          eventName: DomainEventName.TICKET_ASSIGNED,
          aggregateId: 'ticket-2',
          occurredAt: new Date().toISOString(),
          payload: {},
        },
        status: OutboxEventStatus.PROCESSING,
        attempts: 1,
        createdAt: new Date(),
        processedAt: null,
      }),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
      markPendingForRetry: vi.fn().mockResolvedValue(undefined),
      createFromDomainEvent: vi.fn(),
      createProcessedSideEffect: vi.fn(),
      resetStuckProcessing: vi.fn(),
      list: vi.fn(),
      countByStatus: vi.fn(),
      findById: vi.fn(),
    };

    const eventBus: EventBus = {
      subscribe: vi.fn(),
      publish: vi.fn().mockRejectedValue(new Error('handler failed')),
    };

    const service = new OutboxRelayService(repository, eventBus);

    await service.processEvent('outbox-2');

    expect(repository.markPendingForRetry).toHaveBeenCalledWith('outbox-2', 2);
  });
});
