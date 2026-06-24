import { describe, expect, it } from 'vitest';

import {
  calculateSlaHoursOverdue,
  calculateSlaHoursRemaining,
  resolveTicketSlaStatus,
  TicketSlaStatus,
} from './ticket-sla-status.js';

describe('ticket-sla-status', () => {
  const now = new Date('2026-06-24T12:00:00.000Z');

  it('should mark breached tickets when due date has passed', () => {
    const slaDueAt = new Date('2026-06-24T11:00:00.000Z');

    expect(resolveTicketSlaStatus(slaDueAt, now)).toBe(
      TicketSlaStatus.BREACHED,
    );
    expect(calculateSlaHoursOverdue(slaDueAt, now)).toBe(1);
  });

  it('should mark warning tickets within 24 hours of due date', () => {
    const slaDueAt = new Date('2026-06-25T10:00:00.000Z');

    expect(resolveTicketSlaStatus(slaDueAt, now)).toBe(TicketSlaStatus.WARNING);
    expect(calculateSlaHoursRemaining(slaDueAt, now)).toBe(22);
  });

  it('should mark on-time tickets when due date is beyond warning window', () => {
    const slaDueAt = new Date('2026-06-26T12:00:00.000Z');

    expect(resolveTicketSlaStatus(slaDueAt, now)).toBe(TicketSlaStatus.ON_TIME);
  });
});
