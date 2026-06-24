import { UserRole } from '../../../shared/types/user-role.js';
import { TicketHistoryEvent } from './ticket-enums.js';

export const PUBLIC_TICKET_HISTORY_EVENTS: TicketHistoryEvent[] = [
  TicketHistoryEvent.CREATED,
  TicketHistoryEvent.STATUS_CHANGED,
  TicketHistoryEvent.SATISFACTION_SUBMITTED,
];

export function canViewFullTicketHistory(role: UserRole): boolean {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.AGENT ||
    role === UserRole.SUPERVISOR ||
    role === UserRole.OMBUDSMAN
  );
}

export function isPublicTicketHistoryEvent(event: TicketHistoryEvent): boolean {
  return PUBLIC_TICKET_HISTORY_EVENTS.includes(event);
}
