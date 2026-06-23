import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import type { Ticket } from './ticket.entity.js';
import { TicketStatus } from './ticket-enums.js';
import { assertAssigneeRequiredForInProgress } from './ticket-in-progress.rules.js';

const ticketWithoutAssignee: Pick<Ticket, 'assignedToId'> = {
  assignedToId: null,
};

const ticketWithAssignee: Pick<Ticket, 'assignedToId'> = {
  assignedToId: 'agent-1',
};

describe('ticket-in-progress.rules', () => {
  it('should block IN_PROGRESS when ticket has no assignee', () => {
    expect(() =>
      assertAssigneeRequiredForInProgress(
        ticketWithoutAssignee,
        TicketStatus.IN_PROGRESS,
      ),
    ).toThrow(
      new AppError(
        'Ticket must be assigned before moving to IN_PROGRESS.',
        400,
      ),
    );
  });

  it('should allow IN_PROGRESS when ticket has assignee', () => {
    expect(() =>
      assertAssigneeRequiredForInProgress(
        ticketWithAssignee,
        TicketStatus.IN_PROGRESS,
      ),
    ).not.toThrow();
  });

  it('should ignore non IN_PROGRESS target statuses', () => {
    expect(() =>
      assertAssigneeRequiredForInProgress(
        ticketWithoutAssignee,
        TicketStatus.ESCALATED,
      ),
    ).not.toThrow();
  });
});
