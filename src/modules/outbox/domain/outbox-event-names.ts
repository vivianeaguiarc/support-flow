import { DomainEventName } from '../../../shared/events/domain-event-names.js';

export const OutboxEventName = {
  TICKET_CREATED: DomainEventName.TICKET_CREATED,
  TICKET_ASSIGNED: DomainEventName.TICKET_ASSIGNED,
  TICKET_RESOLVED: DomainEventName.TICKET_RESOLVED,
  TICKET_STATUS_CHANGED: DomainEventName.TICKET_STATUS_CHANGED,
  TICKET_CLOSED: DomainEventName.TICKET_CLOSED,
  WEBHOOK_DISPATCHED: 'webhook.dispatched',
  NOTIFICATION_SENT: 'notification.sent',
} as const;

export type OutboxEventNameValue =
  (typeof OutboxEventName)[keyof typeof OutboxEventName];

export const SIDE_EFFECT_OUTBOX_EVENT_NAMES = new Set<string>([
  OutboxEventName.WEBHOOK_DISPATCHED,
  OutboxEventName.NOTIFICATION_SENT,
]);
