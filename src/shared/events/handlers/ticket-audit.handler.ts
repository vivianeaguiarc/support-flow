import {
  BusinessEvent,
  logBusinessEvent,
} from '../../logger/business-logger.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';
import type {
  TicketAssignedEventPayload,
  TicketClosedEventPayload,
  TicketCreatedEventPayload,
  TicketResolvedEventPayload,
  TicketStatusChangedEventPayload,
} from '../ticket/ticket-events.js';

export async function handleTicketAuditEvent(
  event: DomainEvent,
): Promise<void> {
  switch (event.eventName) {
    case DomainEventName.TICKET_CREATED: {
      const payload = event.payload as TicketCreatedEventPayload;
      logBusinessEvent(BusinessEvent.TICKET_CREATED, {
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        protocol: payload.ticket.protocol,
        customerId: payload.customerId,
        priority: payload.priority,
        actorId: payload.actorId,
        assignedToId: payload.assignedToId,
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
      return;
    }
    case DomainEventName.TICKET_ASSIGNED: {
      const payload = event.payload as TicketAssignedEventPayload;
      logBusinessEvent(BusinessEvent.TICKET_ASSIGNED, {
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        fromAssigneeId: payload.previousAssigneeId,
        toAssigneeId: payload.assigneeId,
        actorId: payload.actorId,
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
      return;
    }
    case DomainEventName.TICKET_STATUS_CHANGED: {
      const payload = event.payload as TicketStatusChangedEventPayload;
      logBusinessEvent(BusinessEvent.TICKET_STATUS_CHANGED, {
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        fromStatus: payload.previousStatus,
        toStatus: payload.newStatus,
        actorId: payload.actorId,
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
      return;
    }
    case DomainEventName.TICKET_RESOLVED: {
      const payload = event.payload as TicketResolvedEventPayload;
      logBusinessEvent(BusinessEvent.TICKET_STATUS_CHANGED, {
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        fromStatus: payload.previousStatus,
        toStatus: payload.ticket.status,
        actorId: payload.actorId,
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
      return;
    }
    case DomainEventName.TICKET_CLOSED: {
      const payload = event.payload as TicketClosedEventPayload;
      logBusinessEvent(BusinessEvent.TICKET_STATUS_CHANGED, {
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        fromStatus: payload.previousStatus,
        toStatus: payload.ticket.status,
        actorId: payload.actorId,
        eventId: event.eventId,
        correlationId: event.correlationId,
      });
      return;
    }
    default:
      return;
  }
}
