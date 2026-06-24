import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DomainEvent } from './domain-event.js';
import { EventBus } from './event-bus.js';

function createEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    eventId: 'event-1',
    eventName: 'ticket.created',
    aggregateId: 'ticket-1',
    occurredAt: new Date('2026-06-24T12:00:00.000Z'),
    correlationId: 'corr-1',
    payload: { ticketId: 'ticket-1' },
    ...overrides,
  };
}

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('publishes events to subscribed handlers', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.subscribe('ticket.created', handler);

    const event = createEvent();
    await bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('supports multiple handlers for the same event', async () => {
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    bus.subscribe('ticket.assigned', first);
    bus.subscribe('ticket.assigned', second);

    const event = createEvent({ eventName: 'ticket.assigned' });
    await bus.publish(event);

    expect(first).toHaveBeenCalledWith(event);
    expect(second).toHaveBeenCalledWith(event);
  });

  it('isolates handler failures without breaking other handlers', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('handler failed'));
    const succeeding = vi.fn().mockResolvedValue(undefined);

    bus.subscribe('ticket.status_changed', failing);
    bus.subscribe('ticket.status_changed', succeeding);

    const event = createEvent({ eventName: 'ticket.status_changed' });
    await expect(bus.publish(event)).resolves.toBeUndefined();

    expect(failing).toHaveBeenCalled();
    expect(succeeding).toHaveBeenCalled();
  });

  it('unsubscribes handlers', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    const unsubscribe = bus.subscribe('ticket.closed', handler);

    unsubscribe();

    await bus.publish(createEvent({ eventName: 'ticket.closed' }));

    expect(handler).not.toHaveBeenCalled();
    expect(bus.getHandlerCount('ticket.closed')).toBe(0);
  });
});
