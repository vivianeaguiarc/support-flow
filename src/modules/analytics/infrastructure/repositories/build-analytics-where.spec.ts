import { describe, expect, it } from 'vitest';

import type { AnalyticsFilters } from '../../domain/analytics-filters.js';
import { buildAnalyticsWhere } from './build-analytics-where.js';

describe('buildAnalyticsWhere', () => {
  it('should map analytics filters to prisma where clause', () => {
    const startDate = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-06-30T23:59:59.999Z');

    const filters: AnalyticsFilters = {
      tenantId: 'tenant-1',
      startDate,
      endDate,
      status: 'OPEN',
      priority: 'HIGH',
      agentId: 'agent-1',
    };

    expect(buildAnalyticsWhere(filters)).toEqual({
      tenantId: 'tenant-1',
      status: 'OPEN',
      priority: 'HIGH',
      assignedToId: 'agent-1',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    });
  });
});
