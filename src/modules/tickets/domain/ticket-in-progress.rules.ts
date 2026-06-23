import { AppError } from '../../../shared/errors/app-error.js';
import type { Ticket } from './ticket.entity.js';
import { TicketStatus } from './ticket-enums.js';

export function assertAssigneeRequiredForInProgress(
  ticket: Pick<Ticket, 'assignedToId'>,
  nextStatus: TicketStatus,
): void {
  if (nextStatus !== TicketStatus.IN_PROGRESS) {
    return;
  }

  if (!ticket.assignedToId) {
    throw new AppError(
      'Ticket must be assigned before moving to IN_PROGRESS.',
      400,
    );
  }
}
