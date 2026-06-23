import { TicketStatus } from '@prisma/client';

import { AppError } from '../../../shared/errors/app-error.js';

const ALLOWED_STATUS_TRANSITIONS: Record<
  TicketStatus,
  readonly TicketStatus[]
> = {
  [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED],
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.WAITING_CUSTOMER,
    TicketStatus.ESCALATED,
    TicketStatus.RESOLVED,
  ],
  [TicketStatus.WAITING_CUSTOMER]: [
    TicketStatus.IN_PROGRESS,
    TicketStatus.ESCALATED,
  ],
  [TicketStatus.ESCALATED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [],
};

export function getAllowedTicketStatusTransitions(
  currentStatus: TicketStatus,
): TicketStatus[] {
  return [...ALLOWED_STATUS_TRANSITIONS[currentStatus]];
}

export function assertValidTicketStatusTransition(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
): void {
  if (currentStatus === nextStatus) {
    throw new AppError(`Ticket is already in status ${currentStatus}`, 400);
  }

  const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(nextStatus)) {
    throw new AppError(
      `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      400,
    );
  }
}
