import { randomUUID } from 'node:crypto';

import { getCorrelationId } from '../logger/request-context.js';
import type { DomainEvent } from './domain-event.js';

export function createDomainEvent<TPayload>(input: {
  eventName: string;
  aggregateId: string;
  payload: TPayload;
  correlationId?: string;
  occurredAt?: Date;
}): DomainEvent<TPayload> {
  return {
    eventId: randomUUID(),
    eventName: input.eventName,
    aggregateId: input.aggregateId,
    occurredAt: input.occurredAt ?? new Date(),
    correlationId: input.correlationId ?? getCorrelationId(),
    payload: input.payload,
  };
}
