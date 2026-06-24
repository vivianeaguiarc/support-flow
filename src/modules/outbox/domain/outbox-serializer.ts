import type { DomainEvent } from '../../../shared/events/domain-event.js';

type SerializedDomainEvent = {
  eventId: string;
  eventName: string;
  aggregateId: string;
  occurredAt: string;
  correlationId?: string;
  payload: unknown;
};

export function serializeDomainEvent(
  event: DomainEvent,
): SerializedDomainEvent {
  return {
    eventId: event.eventId,
    eventName: event.eventName,
    aggregateId: event.aggregateId,
    occurredAt: event.occurredAt.toISOString(),
    correlationId: event.correlationId,
    payload: event.payload,
  };
}

export function deserializeDomainEvent(payload: unknown): DomainEvent<unknown> {
  const record = payload as SerializedDomainEvent;

  return {
    eventId: record.eventId,
    eventName: record.eventName,
    aggregateId: record.aggregateId,
    occurredAt: new Date(record.occurredAt),
    correlationId: record.correlationId,
    payload: record.payload,
  };
}
