import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import {
  assertTicketAssignable,
  resolveAssignmentHistoryEvent,
} from './assign-ticket.rules.js';
import { TicketHistoryEvent, TicketStatus } from './ticket-enums.js';

describe('assign-ticket.rules', () => {
  it('should block assignment on resolved or closed tickets', () => {
    expect(() => assertTicketAssignable(TicketStatus.RESOLVED)).toThrow(
      new AppError('Cannot assign a closed or resolved ticket', 400),
    );
    expect(() => assertTicketAssignable(TicketStatus.CLOSED)).toThrow(
      new AppError('Cannot assign a closed or resolved ticket', 400),
    );
  });

  it('should allow assignment on active tickets', () => {
    expect(() => assertTicketAssignable(TicketStatus.OPEN)).not.toThrow();
    expect(() =>
      assertTicketAssignable(TicketStatus.IN_PROGRESS),
    ).not.toThrow();
  });

  it('should distinguish first assignment from reassignment in history', () => {
    expect(resolveAssignmentHistoryEvent(null)).toBe(
      TicketHistoryEvent.ASSIGNED,
    );
    expect(resolveAssignmentHistoryEvent(undefined)).toBe(
      TicketHistoryEvent.ASSIGNED,
    );
    expect(resolveAssignmentHistoryEvent('agent-1')).toBe(
      TicketHistoryEvent.REASSIGNED,
    );
  });
});
