export const DomainEventName = {
  TICKET_CREATED: 'ticket.created',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_CLOSED: 'ticket.closed',
  SLA_BREACHED: 'sla.breached',
  SLA_WARNING: 'sla.warning',
  CSAT_SUBMITTED: 'csat.submitted',
} as const;

export type DomainEventNameValue =
  (typeof DomainEventName)[keyof typeof DomainEventName];
