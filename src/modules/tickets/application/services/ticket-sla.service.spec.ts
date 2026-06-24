import { describe, expect, it } from 'vitest';

import { TicketPriority } from '../../domain/ticket-enums.js';
import { PRIORITY_SLA_HOURS } from '../../domain/ticket-sla.js';
import { TicketSlaStatus } from '../../domain/ticket-sla-status.js';
import { TicketSlaService } from './ticket-sla.service.js';

describe('TicketSlaService', () => {
  const service = new TicketSlaService();

  it('should expose priority SLA hours through service', () => {
    expect(service.resolveHoursForPriority(TicketPriority.URGENT)).toBe(
      PRIORITY_SLA_HOURS.URGENT,
    );
  });

  it('should resolve SLA status using domain rules', () => {
    const now = new Date('2026-06-24T12:00:00.000Z');
    const slaDueAt = new Date('2026-06-24T10:00:00.000Z');

    expect(service.resolveStatus(slaDueAt, now)).toBe(TicketSlaStatus.BREACHED);
    expect(service.isBreached(slaDueAt, now)).toBe(true);
  });
});
