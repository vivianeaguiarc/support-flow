export const EmailNotificationEvent = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_REASSIGNED: 'TICKET_REASSIGNED',
  TICKET_STATUS_CHANGED: 'TICKET_STATUS_CHANGED',
  TICKET_RESOLVED: 'TICKET_RESOLVED',
  TICKET_CLOSED: 'TICKET_CLOSED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACHED: 'SLA_BREACHED',
} as const;

export type EmailNotificationEvent =
  (typeof EmailNotificationEvent)[keyof typeof EmailNotificationEvent];
