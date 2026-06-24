import { notificationEventService } from '../../../modules/notifications/application/services/notification-event.service.js';
import type { DomainEvent } from '../domain-event.js';
import { DomainEventName } from '../domain-event-names.js';
import type {
  SlaBreachedEventPayload,
  SlaWarningEventPayload,
  TicketAssignedEventPayload,
  TicketCreatedEventPayload,
  TicketStatusChangedEventPayload,
} from '../ticket/ticket-events.js';

export async function handleTicketNotificationEvent(
  event: DomainEvent,
): Promise<void> {
  switch (event.eventName) {
    case DomainEventName.TICKET_CREATED: {
      const payload = event.payload as TicketCreatedEventPayload;
      await notificationEventService.notifyTicketCreated(
        payload.ticket,
        payload.customerId,
      );
      return;
    }
    case DomainEventName.TICKET_ASSIGNED: {
      const payload = event.payload as TicketAssignedEventPayload;
      if (payload.isReassignment) {
        await notificationEventService.notifyTicketReassigned(
          payload.ticket,
          payload.assigneeId,
        );
      } else {
        await notificationEventService.notifyTicketAssigned(
          payload.ticket,
          payload.assigneeId,
        );
      }
      return;
    }
    case DomainEventName.TICKET_STATUS_CHANGED: {
      const payload = event.payload as TicketStatusChangedEventPayload;
      await notificationEventService.notifyTicketStatusChanged(
        payload.ticket,
        payload.previousStatus,
        payload.newStatus,
      );
      return;
    }
    case DomainEventName.SLA_WARNING: {
      const payload = event.payload as SlaWarningEventPayload;
      await notificationEventService.notifySlaWarning(payload.ticket, {
        hoursRemaining: payload.hoursRemaining,
      });
      return;
    }
    case DomainEventName.SLA_BREACHED: {
      const payload = event.payload as SlaBreachedEventPayload;
      await notificationEventService.notifySlaExpired(payload.ticket, {
        hoursOverdue: payload.hoursOverdue,
      });
      return;
    }
    default:
      return;
  }
}
