import { describe, expect, it } from 'vitest';

import { UserRole } from '../../../shared/types/user-role.js';
import { TicketHistoryEvent } from './ticket-enums.js';
import {
  canViewFullTicketHistory,
  isPublicTicketHistoryEvent,
  PUBLIC_TICKET_HISTORY_EVENTS,
} from './ticket-history-policy.js';

describe('ticket-history-policy', () => {
  it('should expose only CREATED and STATUS_CHANGED as public events', () => {
    expect(PUBLIC_TICKET_HISTORY_EVENTS).toEqual([
      TicketHistoryEvent.CREATED,
      TicketHistoryEvent.STATUS_CHANGED,
    ]);
  });

  it('should allow staff roles to view full history', () => {
    expect(canViewFullTicketHistory(UserRole.ADMIN)).toBe(true);
    expect(canViewFullTicketHistory(UserRole.AGENT)).toBe(true);
    expect(canViewFullTicketHistory(UserRole.SUPERVISOR)).toBe(true);
    expect(canViewFullTicketHistory(UserRole.OMBUDSMAN)).toBe(true);
  });

  it('should restrict customers to public events only', () => {
    expect(canViewFullTicketHistory(UserRole.CUSTOMER)).toBe(false);
    expect(isPublicTicketHistoryEvent(TicketHistoryEvent.CREATED)).toBe(true);
    expect(isPublicTicketHistoryEvent(TicketHistoryEvent.STATUS_CHANGED)).toBe(
      true,
    );
    expect(isPublicTicketHistoryEvent(TicketHistoryEvent.ASSIGNED)).toBe(false);
    expect(isPublicTicketHistoryEvent(TicketHistoryEvent.COMMENT_ADDED)).toBe(
      false,
    );
    expect(isPublicTicketHistoryEvent(TicketHistoryEvent.SLA_BREACHED)).toBe(
      false,
    );
  });
});
