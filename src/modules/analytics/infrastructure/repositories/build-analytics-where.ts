import type { Prisma } from '@prisma/client';

import type { AnalyticsFilters } from '../../domain/analytics-filters.js';

export function buildAnalyticsWhere(
  filters: AnalyticsFilters,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {
    tenantId: filters.tenantId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.agentId) {
    where.assignedToId = filters.agentId;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  return where;
}
