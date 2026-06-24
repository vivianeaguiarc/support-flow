import { env } from '../../../../config/env.js';
import {
  type EventBus,
  eventBus as defaultEventBus,
} from '../../../../shared/events/event-bus.js';
import { logger } from '../../../../shared/logger/logger.js';
import { metricsService } from '../../../observability/application/metrics.service.js';
import { queueProvider } from '../../../queues/queue-provider.js';
import { SIDE_EFFECT_OUTBOX_EVENT_NAMES } from '../../domain/outbox-event-names.js';
import { deserializeDomainEvent } from '../../domain/outbox-serializer.js';
import {
  OutboxRepository,
  outboxRepository as defaultOutboxRepository,
} from '../../infrastructure/repositories/outbox.repository.js';

export class OutboxRelayService {
  constructor(
    private readonly repository: OutboxRepository = defaultOutboxRepository,
    private readonly eventBus: EventBus = defaultEventBus,
  ) {}

  async scheduleRelay(): Promise<void> {
    if (env.QUEUE_ENABLED) {
      await queueProvider.addOutboxRelayJob();
      return;
    }

    await this.relayPendingBatch();
  }

  async relayPendingBatch(): Promise<number> {
    const pending = await this.repository.findPendingBatch(
      env.OUTBOX_RELAY_BATCH_SIZE,
      env.OUTBOX_MAX_ATTEMPTS,
    );

    let processed = 0;

    for (const event of pending) {
      try {
        if (env.QUEUE_ENABLED) {
          await queueProvider.addOutboxJob({ outboxEventId: event.id });
        } else {
          await this.processEvent(event.id);
        }

        processed += 1;
      } catch (error) {
        logger.warn(
          {
            err: error,
            outboxEventId: event.id,
          },
          'outbox.relay.event_failed',
        );
      }
    }

    if (processed > 0) {
      logger.info({ processed }, 'outbox.relay.batch_scheduled');
    }

    return processed;
  }

  async processEvent(outboxEventId: string): Promise<void> {
    const claimed = await this.repository.claimForProcessing(outboxEventId);

    if (!claimed) {
      return;
    }

    const startedAt = Date.now();

    try {
      if (SIDE_EFFECT_OUTBOX_EVENT_NAMES.has(claimed.eventName)) {
        await this.repository.markProcessed(claimed.id);
        metricsService.recordOutboxProcessed();
        return;
      }

      const domainEvent = deserializeDomainEvent(claimed.payload);
      await this.eventBus.publish(domainEvent);
      await this.repository.markProcessed(claimed.id);
      metricsService.recordOutboxProcessed();

      logger.info(
        {
          outboxEventId: claimed.id,
          eventName: claimed.eventName,
          aggregateId: claimed.aggregateId,
          durationMs: Date.now() - startedAt,
        },
        'outbox.event.processed',
      );
    } catch (error) {
      const attempts = claimed.attempts + 1;
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (attempts >= env.OUTBOX_MAX_ATTEMPTS) {
        await this.repository.markFailed(claimed.id, attempts);
        metricsService.recordOutboxFailed();

        if (env.QUEUE_ENABLED) {
          await queueProvider.addOutboxDeadLetterJob({
            outboxEventId: claimed.id,
            eventName: claimed.eventName,
            aggregateId: claimed.aggregateId,
            error: message,
            attempts,
          });
        }

        logger.error(
          {
            err: error,
            outboxEventId: claimed.id,
            eventName: claimed.eventName,
            attempts,
          },
          'outbox.event.dead_lettered',
        );
      } else {
        await this.repository.markPendingForRetry(claimed.id, attempts);

        logger.warn(
          {
            err: error,
            outboxEventId: claimed.id,
            eventName: claimed.eventName,
            attempts,
            retryDelayMs: env.OUTBOX_BACKOFF_DELAY_MS * 2 ** (attempts - 1),
          },
          'outbox.event.retry_scheduled',
        );
      }
    } finally {
      metricsService.refreshOutboxPendingGauge();
    }
  }
}

export const outboxRelayService = new OutboxRelayService();
