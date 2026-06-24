import { logger } from '../logger/logger.js';
import type { DomainEvent, DomainEventHandler } from './domain-event.js';

export type EventBusUnsubscribe = () => void;

export class EventBus {
  private readonly handlers = new Map<string, Set<DomainEventHandler>>();

  subscribe(
    eventName: string,
    handler: DomainEventHandler,
  ): EventBusUnsubscribe {
    const handlers =
      this.handlers.get(eventName) ?? new Set<DomainEventHandler>();
    handlers.add(handler);
    this.handlers.set(eventName, handlers);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    logger.info(
      {
        eventId: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt.toISOString(),
        correlationId: event.correlationId,
      },
      'domain_event.published',
    );

    const handlers = this.handlers.get(event.eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const handlerList = [...handlers];
    const results = await Promise.allSettled(
      handlerList.map((handler) => handler(event)),
    );

    for (const [index, result] of results.entries()) {
      if (result.status === 'rejected') {
        const handler = handlerList[index];
        logger.error(
          {
            err: result.reason,
            eventId: event.eventId,
            eventName: event.eventName,
            aggregateId: event.aggregateId,
            correlationId: event.correlationId,
            handlerName: handler?.name || 'anonymous_handler',
          },
          'domain_event.handler_failed',
        );
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }

  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size ?? 0;
  }
}

export const eventBus = new EventBus();
