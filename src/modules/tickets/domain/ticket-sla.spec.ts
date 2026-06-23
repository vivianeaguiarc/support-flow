import { TicketPriority } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  calculateSlaDueAt,
  DEFAULT_SLA_FALLBACK_HOURS,
  resolveSlaHours,
} from './ticket-sla.js';

describe('ticket-sla', () => {
  it('should use priority SLA over category and tenant defaults', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 72,
      categorySlaHours: 120,
      priority: TicketPriority.HIGH,
    });

    expect(hours).toBe(24);
  });

  it('should use category SLA when priority is not mapped explicitly', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 72,
      categorySlaHours: 120,
      priority: TicketPriority.MEDIUM,
    });

    expect(hours).toBe(48);
  });

  it('should use tenant default when category is absent', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: 96,
      categorySlaHours: null,
      priority: TicketPriority.LOW,
    });

    expect(hours).toBe(72);
  });

  it('should use priority SLA even when tenant default is missing', () => {
    const hours = resolveSlaHours({
      tenantDefaultSlaHours: null,
      categorySlaHours: null,
      priority: TicketPriority.MEDIUM,
    });

    expect(hours).toBe(48);
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
    const dueAt = calculateSlaDueAt(createdAt, 48);

    expect(dueAt.toISOString()).toBe('2026-06-25T10:00:00.000Z');
  });
});
