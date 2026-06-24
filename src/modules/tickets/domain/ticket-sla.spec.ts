import { describe, expect, it } from 'vitest';

import { TicketPriority } from './ticket-enums.js';
import {
  calculateSlaDueAt,
  DEFAULT_SLA_FALLBACK_HOURS,
  PRIORITY_SLA_HOURS,
  resolveSlaHours,
} from './ticket-sla.js';

describe('ticket-sla', () => {
  it('should expose priority SLA hours per business policy', () => {
    expect(PRIORITY_SLA_HOURS).toEqual({
      LOW: 72,
      MEDIUM: 24,
      HIGH: 8,
      URGENT: 2,
    });
  });

  it('should use priority SLA over category and tenant defaults', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 72,
      categorySlaHours: 120,
      priority: TicketPriority.HIGH,
    });

    expect(hours).toBe(8);
  });

  it('should use category SLA when priority is not mapped explicitly', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 72,
      categorySlaHours: 120,
      priority: 'UNKNOWN' as TicketPriority,
    });

    expect(hours).toBe(120);
  });

  it('should use tenant default when category is absent', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 96,
      categorySlaHours: null,
      priority: TicketPriority.LOW,
    });

    expect(hours).toBe(72);
  });

  it('should fallback to 72 hours when no policy source is available', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: null,
      categorySlaHours: null,
      priority: 'UNKNOWN' as TicketPriority,
    });

    expect(hours).toBe(DEFAULT_SLA_FALLBACK_HOURS);
  });

  it('should calculate due date from createdAt plus SLA hours', () => {
    const createdAt = new Date('2026-06-23T10:00:00.000Z');
    const dueAt = calculateSlaDueAt(createdAt, 24);

    expect(dueAt.toISOString()).toBe('2026-06-24T10:00:00.000Z');
  });
});
