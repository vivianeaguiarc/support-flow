import { AppError } from '../../../shared/errors/app-error.js';
import { TicketHistoryEvent, TicketStatus } from './ticket-enums.js';

export function assertTicketAssignable(status: TicketStatus): void {
  if (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) {
    throw new AppError('Cannot assign a closed or resolved ticket', 400);
  }
}

export function resolveAssignmentHistoryEvent(
  previousAssigneeId: string | null | undefined,
): typeof TicketHistoryEvent.ASSIGNED | typeof TicketHistoryEvent.REASSIGNED {
  return previousAssigneeId
    ? TicketHistoryEvent.REASSIGNED
    : TicketHistoryEvent.ASSIGNED;
}
