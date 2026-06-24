import { buildCsatWebhookData } from '../../../modules/webhooks/application/helpers/webhook-payload.helper.js';
import { buildTicketWebhookData } from '../../../modules/webhooks/application/helpers/webhook-payload.helper.js';
import { webhookDispatcher } from '../../../modules/webhooks/application/services/webhook-dispatcher.js';
import { WebhookEvent } from '../../../modules/webhooks/domain/webhook-event.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';
import type {
  CsatSubmittedEventPayload,
  SlaBreachedEventPayload,
  SlaWarningEventPayload,
  TicketAssignedEventPayload,
  TicketClosedEventPayload,
  TicketCreatedEventPayload,
  TicketResolvedEventPayload,
  TicketStatusChangedEventPayload,
} from '../ticket/ticket-events.js';

export async function handleTicketWebhookEvent(
  event: DomainEvent,
): Promise<void> {
  switch (event.eventName) {
    case DomainEventName.TICKET_CREATED: {
      const payload = event.payload as TicketCreatedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_CREATED,
        buildTicketWebhookData(payload.ticket),
      );
      return;
    }
    case DomainEventName.TICKET_ASSIGNED: {
      const payload = event.payload as TicketAssignedEventPayload;
      const ticketData = buildTicketWebhookData(payload.ticket);
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_ASSIGNED,
        {
          ...ticketData,
          fromAssigneeId: payload.previousAssigneeId,
          toAssigneeId: payload.assigneeId,
        },
      );
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_UPDATED,
        ticketData,
      );
      return;
    }
    case DomainEventName.TICKET_STATUS_CHANGED: {
      const payload = event.payload as TicketStatusChangedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_UPDATED,
        {
          ...buildTicketWebhookData(payload.ticket),
          fromStatus: payload.previousStatus,
          toStatus: payload.newStatus,
        },
      );
      return;
    }
    case DomainEventName.TICKET_RESOLVED: {
      const payload = event.payload as TicketResolvedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_RESOLVED,
        {
          ...buildTicketWebhookData(payload.ticket),
          fromStatus: payload.previousStatus,
          toStatus: payload.ticket.status,
        },
      );
      return;
    }
    case DomainEventName.TICKET_CLOSED: {
      const payload = event.payload as TicketClosedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.TICKET_CLOSED,
        {
          ...buildTicketWebhookData(payload.ticket),
          fromStatus: payload.previousStatus,
          toStatus: payload.ticket.status,
        },
      );
      return;
    }
    case DomainEventName.SLA_WARNING: {
      const payload = event.payload as SlaWarningEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.SLA_WARNING,
        {
          ...buildTicketWebhookData(payload.ticket),
          hoursRemaining: payload.hoursRemaining,
        },
      );
      return;
    }
    case DomainEventName.SLA_BREACHED: {
      const payload = event.payload as SlaBreachedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.SLA_BREACHED,
        {
          ...buildTicketWebhookData(payload.ticket),
          hoursOverdue: payload.hoursOverdue,
        },
      );
      return;
    }
    case DomainEventName.CSAT_SUBMITTED: {
      const payload = event.payload as CsatSubmittedEventPayload;
      await webhookDispatcher.dispatch(
        payload.tenantId,
        WebhookEvent.CSAT_SUBMITTED,
        buildCsatWebhookData(payload.survey, payload.ticket),
      );
      return;
    }
    default:
      return;
  }
}
