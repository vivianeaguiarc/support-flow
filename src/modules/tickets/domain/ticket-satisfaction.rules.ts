import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from '../../../shared/errors/http-errors.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../shared/types/user-role.js';
import type { Ticket } from './ticket.entity.js';
import { TicketStatus } from './ticket-enums.js';
import { SATISFACTION_ELIGIBLE_STATUSES } from './ticket-satisfaction-survey.entity.js';

export function assertCanSubmitTicketSatisfaction(
  authUser: AuthenticatedUser,
  ticket: Ticket,
): void {
  if (authUser.role !== UserRole.CUSTOMER) {
    throw new ForbiddenError('Only customers can submit satisfaction surveys');
  }

  if (ticket.customerId !== authUser.id) {
    throw new ForbiddenError('Forbidden');
  }

  if (
    ticket.status !== TicketStatus.RESOLVED &&
    ticket.status !== TicketStatus.CLOSED
  ) {
    throw new BadRequestError(
      'Satisfaction survey is only available for resolved or closed tickets',
    );
  }
}

export function assertTicketHasNoSatisfactionSurvey(
  existingSurvey: { id: string } | null,
): void {
  if (existingSurvey) {
    throw new ConflictError('This ticket already has a satisfaction survey');
  }
}

export function isSatisfactionEligibleStatus(status: string): boolean {
  return (SATISFACTION_ELIGIBLE_STATUSES as readonly string[]).includes(status);
}
