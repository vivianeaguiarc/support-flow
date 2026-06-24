import { auditLogService } from '../../../modules/audit/application/services/audit-log.service.js';
import {
  AuditAction,
  type AuditActionValue,
  AuditEntity,
} from '../../../modules/audit/domain/audit-actions.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';
import type {
  TicketAssignedEventPayload,
  TicketClosedEventPayload,
  TicketCreatedEventPayload,
  TicketResolvedEventPayload,
  TicketStatusChangedEventPayload,
} from '../ticket/ticket-events.js';

/**
 * Persists relevant ticket lifecycle changes into the immutable audit trail.
 * Subscribed to the Event Bus so it requires no changes to the ticket use cases.
 */
export async function handleTicketAuditLogEvent(
  event: DomainEvent,
): Promise<void> {
  switch (event.eventName) {
    case DomainEventName.TICKET_CREATED: {
      const payload = event.payload as TicketCreatedEventPayload;
      await record(
        AuditAction.TICKET_CREATED,
        payload.tenantId,
        payload.actorId,
        {
          entityId: payload.ticket.id,
          newValues: {
            protocol: payload.ticket.protocol,
            status: payload.ticket.status,
            priority: payload.priority,
            customerId: payload.customerId,
            assignedToId: payload.assignedToId ?? null,
          },
          correlationId: event.correlationId,
        },
      );
      return;
    }
    case DomainEventName.TICKET_ASSIGNED: {
      const payload = event.payload as TicketAssignedEventPayload;
      await record(
        AuditAction.TICKET_ASSIGNED,
        payload.tenantId,
        payload.actorId,
        {
          entityId: payload.ticket.id,
          oldValues: { assignedToId: payload.previousAssigneeId ?? null },
          newValues: { assignedToId: payload.assigneeId },
          metadata: { isReassignment: payload.isReassignment },
          correlationId: event.correlationId,
        },
      );
      return;
    }
    case DomainEventName.TICKET_STATUS_CHANGED: {
      const payload = event.payload as TicketStatusChangedEventPayload;
      await record(
        AuditAction.TICKET_STATUS_CHANGED,
        payload.tenantId,
        payload.actorId,
        {
          entityId: payload.ticket.id,
          oldValues: { status: payload.previousStatus },
          newValues: { status: payload.newStatus },
          correlationId: event.correlationId,
        },
      );
      return;
    }
    case DomainEventName.TICKET_RESOLVED: {
      const payload = event.payload as TicketResolvedEventPayload;
      await record(
        AuditAction.TICKET_RESOLVED,
        payload.tenantId,
        payload.actorId,
        {
          entityId: payload.ticket.id,
          oldValues: { status: payload.previousStatus },
          newValues: { status: payload.ticket.status },
          correlationId: event.correlationId,
        },
      );
      return;
    }
    case DomainEventName.TICKET_CLOSED: {
      const payload = event.payload as TicketClosedEventPayload;
      await record(
        AuditAction.TICKET_CLOSED,
        payload.tenantId,
        payload.actorId,
        {
          entityId: payload.ticket.id,
          oldValues: { status: payload.previousStatus },
          newValues: { status: payload.ticket.status },
          correlationId: event.correlationId,
        },
      );
      return;
    }
    default:
      return;
  }
}

async function record(
  action: AuditActionValue,
  organizationId: string,
  actorId: string | undefined,
  details: {
    entityId: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    correlationId?: string;
  },
): Promise<void> {
  await auditLogService.record({
    organizationId,
    userId: actorId ?? null,
    action,
    entity: AuditEntity.TICKET,
    entityId: details.entityId,
    oldValues: details.oldValues ?? null,
    newValues: details.newValues ?? null,
    metadata: details.correlationId
      ? { ...(details.metadata ?? {}), correlationId: details.correlationId }
      : (details.metadata ?? null),
  });
}
