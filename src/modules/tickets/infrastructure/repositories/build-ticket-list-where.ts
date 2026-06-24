import type { Prisma } from '@prisma/client';

import { TicketStatus } from '../../domain/ticket-enums.js';
import type { TicketListFilters } from '../../domain/ticket-list-filters.js';

export function buildTicketListWhere(
  filters: TicketListFilters,
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

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.unassigned) {
    where.assignedToId = null;
  } else if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId;
  }

  if (filters.team) {
    where.assignedTo = {
      role: filters.team,
    };
  }

  if (filters.overdue) {
    where.slaDueAt = { lt: new Date() };
    where.status = { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] };
  }

  if (filters.search) {
    const term = filters.search.trim();

    if (term.length > 0) {
      where.OR = [
        { protocol: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }
  }

  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  return where;
}
