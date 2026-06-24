export const WebhookEvent = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_CLOSED: 'ticket.closed',
  SLA_WARNING: 'sla.warning',
  SLA_BREACHED: 'sla.breached',
  CSAT_SUBMITTED: 'csat.submitted',
} as const;

export type WebhookEvent = (typeof WebhookEvent)[keyof typeof WebhookEvent];

export const WEBHOOK_EVENTS = Object.values(WebhookEvent);

export type WebhookPayload = {
  id: string;
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
};
