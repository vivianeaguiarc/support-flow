import { describe, expect, it } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import { TicketStatus } from './ticket-enums.js';
import {
  assertValidTicketStatusTransition,
  getAllowedTicketStatusTransitions,
} from './ticket-status-transitions.js';

describe('ticket-status-transitions', () => {
  it('should return allowed transitions for OPEN', () => {
    expect(getAllowedTicketStatusTransitions(TicketStatus.OPEN)).toEqual([
      TicketStatus.IN_PROGRESS,
      TicketStatus.ESCALATED,
    ]);
  });

  it('should return no transitions for CLOSED', () => {
    expect(getAllowedTicketStatusTransitions(TicketStatus.CLOSED)).toEqual([]);
  });

  it('should allow OPEN to IN_PROGRESS', () => {
    expect(() =>
      assertValidTicketStatusTransition(
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
      ),
    ).not.toThrow();
  });

  it('should allow IN_PROGRESS to RESOLVED', () => {
    expect(() =>
      assertValidTicketStatusTransition(
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
      ),
    ).not.toThrow();
  });

  it('should allow RESOLVED to CLOSED', () => {
    expect(() =>
      assertValidTicketStatusTransition(
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ),
    ).not.toThrow();
  });

  it('should reject OPEN to CLOSED', () => {
    expect(() =>
      assertValidTicketStatusTransition(TicketStatus.OPEN, TicketStatus.CLOSED),
    ).toThrow(
      new AppError('Invalid status transition from OPEN to CLOSED', 400),
    );
  });

  it('should reject CLOSED to any status', () => {
    expect(() =>
      assertValidTicketStatusTransition(TicketStatus.CLOSED, TicketStatus.OPEN),
    ).toThrow(
      new AppError('Invalid status transition from CLOSED to OPEN', 400),
    );
  });

  it('should reject transition to the same status', () => {
    expect(() =>
      assertValidTicketStatusTransition(
        TicketStatus.IN_PROGRESS,
        TicketStatus.IN_PROGRESS,
      ),
    ).toThrow(new AppError('Ticket is already in status IN_PROGRESS', 400));
  });
});
