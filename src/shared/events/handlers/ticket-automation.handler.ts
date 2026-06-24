import { automationEngine } from '../../../modules/automation/application/services/automation-engine.js';
import { AutomationTrigger } from '../../../modules/automation/domain/automation-trigger.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';
import type {
  SlaBreachedEventPayload,
  SlaWarningEventPayload,
  TicketAssignedEventPayload,
  TicketCreatedEventPayload,
  TicketStatusChangedEventPayload,
} from '../ticket/ticket-events.js';

export async function handleTicketAutomationEvent(
  event: DomainEvent,
): Promise<void> {
  switch (event.eventName) {
    case DomainEventName.TICKET_CREATED: {
      const payload = event.payload as TicketCreatedEventPayload;
      await automationEngine.processEvent({
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        trigger: AutomationTrigger.TICKET_CREATED,
        ticket: payload.ticket,
        actorId: payload.actorId,
      });
      return;
    }
    case DomainEventName.TICKET_ASSIGNED: {
      const payload = event.payload as TicketAssignedEventPayload;
      await automationEngine.processEvent({
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        trigger: AutomationTrigger.TICKET_UPDATED,
        ticket: payload.ticket,
        previousTicket: { assignedToId: payload.previousAssigneeId },
        actorId: payload.actorId,
      });
      return;
    }
    case DomainEventName.TICKET_STATUS_CHANGED: {
      const payload = event.payload as TicketStatusChangedEventPayload;
      await automationEngine.processEvent({
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        trigger: AutomationTrigger.STATUS_CHANGED,
        ticket: payload.ticket,
        previousTicket: { status: payload.previousStatus },
        actorId: payload.actorId,
      });
      return;
    }
    case DomainEventName.SLA_WARNING: {
      const payload = event.payload as SlaWarningEventPayload;
      await automationEngine.processEvent({
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        trigger: AutomationTrigger.SLA_WARNING,
        ticket: payload.ticket,
        metadata: { hoursRemaining: payload.hoursRemaining },
      });
      return;
    }
    case DomainEventName.SLA_BREACHED: {
      const payload = event.payload as SlaBreachedEventPayload;
      await automationEngine.processEvent({
        tenantId: payload.tenantId,
        ticketId: payload.ticket.id,
        trigger: AutomationTrigger.SLA_BREACHED,
        ticket: payload.ticket,
        metadata: { hoursOverdue: payload.hoursOverdue },
      });
      return;
    }
    default:
      return;
  }
}
