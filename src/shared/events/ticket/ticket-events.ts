import type { Ticket } from '../../../modules/tickets/domain/ticket.entity.js';
import type { TicketStatus } from '../../../modules/tickets/domain/ticket-enums.js';
import type { TicketSatisfactionSurvey } from '../../../modules/tickets/domain/ticket-satisfaction-survey.entity.js';
import { createDomainEvent } from '../create-domain-event.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';

export type TicketCreatedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  customerId: string;
  actorId?: string;
  priority: string;
  assignedToId?: string | null;
};

export type TicketAssignedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  assigneeId: string;
  previousAssigneeId?: string | null;
  actorId?: string;
  isReassignment: boolean;
};

export type TicketStatusChangedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  previousStatus: TicketStatus;
  newStatus: TicketStatus;
  actorId?: string;
};

export type TicketResolvedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  previousStatus: TicketStatus;
  actorId?: string;
};

export type TicketClosedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  previousStatus: TicketStatus;
  actorId?: string;
};

export type SlaBreachedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  hoursOverdue: number;
};

export type SlaWarningEventPayload = {
  tenantId: string;
  ticket: Ticket;
  hoursRemaining: number;
};

export type CsatSubmittedEventPayload = {
  tenantId: string;
  ticket: Ticket;
  survey: TicketSatisfactionSurvey;
  customerId: string;
};

export type TicketCreatedEvent = DomainEvent<TicketCreatedEventPayload>;
export type TicketAssignedEvent = DomainEvent<TicketAssignedEventPayload>;
export type TicketStatusChangedEvent =
  DomainEvent<TicketStatusChangedEventPayload>;
export type TicketResolvedEvent = DomainEvent<TicketResolvedEventPayload>;
export type TicketClosedEvent = DomainEvent<TicketClosedEventPayload>;
export type SlaBreachedEvent = DomainEvent<SlaBreachedEventPayload>;
export type SlaWarningEvent = DomainEvent<SlaWarningEventPayload>;
export type CsatSubmittedEvent = DomainEvent<CsatSubmittedEventPayload>;

export function createTicketCreatedEvent(
  payload: TicketCreatedEventPayload,
): TicketCreatedEvent {
  return createDomainEvent({
    eventName: DomainEventName.TICKET_CREATED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createTicketAssignedEvent(
  payload: TicketAssignedEventPayload,
): TicketAssignedEvent {
  return createDomainEvent({
    eventName: DomainEventName.TICKET_ASSIGNED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createTicketStatusChangedEvent(
  payload: TicketStatusChangedEventPayload,
): TicketStatusChangedEvent {
  return createDomainEvent({
    eventName: DomainEventName.TICKET_STATUS_CHANGED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createTicketResolvedEvent(
  payload: TicketResolvedEventPayload,
): TicketResolvedEvent {
  return createDomainEvent({
    eventName: DomainEventName.TICKET_RESOLVED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createTicketClosedEvent(
  payload: TicketClosedEventPayload,
): TicketClosedEvent {
  return createDomainEvent({
    eventName: DomainEventName.TICKET_CLOSED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createSlaBreachedEvent(
  payload: SlaBreachedEventPayload,
): SlaBreachedEvent {
  return createDomainEvent({
    eventName: DomainEventName.SLA_BREACHED,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createSlaWarningEvent(
  payload: SlaWarningEventPayload,
): SlaWarningEvent {
  return createDomainEvent({
    eventName: DomainEventName.SLA_WARNING,
    aggregateId: payload.ticket.id,
    payload,
  });
}

export function createCsatSubmittedEvent(
  payload: CsatSubmittedEventPayload,
): CsatSubmittedEvent {
  return createDomainEvent({
    eventName: DomainEventName.CSAT_SUBMITTED,
    aggregateId: payload.ticket.id,
    payload,
  });
}
