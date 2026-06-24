import { describe, expect, it } from 'vitest';

import { createDomainEvent } from '../../../shared/events/create-domain-event.js';
import { DomainEventName } from '../../../shared/events/domain-event-names.js';
import {
  deserializeDomainEvent,
  serializeDomainEvent,
} from './outbox-serializer.js';

describe('outbox serializer', () => {
  it('round-trips domain events', () => {
    const event = createDomainEvent({
      eventName: DomainEventName.TICKET_CREATED,
      aggregateId: 'ticket-1',
      payload: { tenantId: 'tenant-1' },
    });

    const serialized = serializeDomainEvent(event);
    const restored = deserializeDomainEvent(serialized);

    expect(restored).toMatchObject({
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      payload: event.payload,
    });
    expect(restored.occurredAt).toBeInstanceOf(Date);
  });
});
