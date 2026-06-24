import { DomainEventName } from './domain-event-names.js';
import type { EventBus } from './event-bus.js';
import { eventBus as defaultEventBus } from './event-bus.js';
import { handleTicketAuditLogEvent } from './handlers/audit-log.handler.js';
import { handleTicketAuditEvent } from './handlers/ticket-audit.handler.js';
import { handleTicketAutomationEvent } from './handlers/ticket-automation.handler.js';
import { handleTicketNotificationEvent } from './handlers/ticket-notification.handler.js';
import { handleTicketWebhookEvent } from './handlers/ticket-webhook.handler.js';

const TICKET_EVENT_NAMES = Object.values(DomainEventName);

let registered = false;

export function registerEventHandlers(bus: EventBus = defaultEventBus): void {
  if (registered && bus === defaultEventBus) {
    return;
  }

  for (const eventName of TICKET_EVENT_NAMES) {
    bus.subscribe(eventName, handleTicketAuditEvent);
    bus.subscribe(eventName, handleTicketAuditLogEvent);
    bus.subscribe(eventName, handleTicketNotificationEvent);
    bus.subscribe(eventName, handleTicketAutomationEvent);
    bus.subscribe(eventName, handleTicketWebhookEvent);
  }

  if (bus === defaultEventBus) {
    registered = true;
  }
}

export function resetEventHandlerRegistrationForTests(): void {
  registered = false;
}
