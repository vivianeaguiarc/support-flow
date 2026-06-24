import { describe, expect, it } from 'vitest';

import {
  calculateResolutionMetrics,
  groupTicketsByPeriod,
} from './analytics-resolution.js';

describe('analytics-resolution', () => {
  it('should calculate average resolution time and SLA compliance', () => {
    const createdAt = new Date('2026-06-01T10:00:00.000Z');
    const closedAt = new Date('2026-06-01T14:00:00.000Z');
    const slaDueAt = new Date('2026-06-01T18:00:00.000Z');

    const metrics = calculateResolutionMetrics([
      {
        createdAt,
        closedAt,
        updatedAt: closedAt,
        slaDueAt,
      },
      {
        createdAt,
        closedAt: new Date('2026-06-01T20:00:00.000Z'),
        updatedAt: new Date('2026-06-01T20:00:00.000Z'),
        slaDueAt,
      },
    ]);

    expect(metrics.avgResolutionTimeHours).toBe(7);
    expect(metrics.slaComplianceRate).toBe(50);
  });

  it('should group tickets by day', () => {
    const grouped = groupTicketsByPeriod([
      { createdAt: new Date('2026-06-01T10:00:00.000Z') },
      { createdAt: new Date('2026-06-01T15:00:00.000Z') },
      { createdAt: new Date('2026-06-02T08:00:00.000Z') },
    ]);

    expect(grouped).toEqual([
      { period: '2026-06-01', count: 2 },
      { period: '2026-06-02', count: 1 },
    ]);
  });
});
