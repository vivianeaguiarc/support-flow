import { prisma } from '../../../../shared/database/prisma.js';
import { TicketStatus } from '../../domain/ticket-enums.js';
import type { TicketListFilters } from '../../domain/ticket-list-filters.js';
import type { TicketSummary } from '../../domain/ticket-summary.js';
import { buildTicketListWhere } from './build-ticket-list-where.js';

export async function getTicketSummary(
  filters: TicketListFilters,
): Promise<TicketSummary> {
  const baseFilters = { ...filters };
  delete baseFilters.overdue;
  delete baseFilters.unassigned;
  delete baseFilters.assignedToId;

  const baseWhere = buildTicketListWhere(baseFilters);

  const [total, byStatus, byPriority, overdueCount, unassignedCount] =
    await Promise.all([
      prisma.ticket.count({ where: buildTicketListWhere(filters) }),

      prisma.ticket.groupBy({
        by: ['status'],
        where: buildTicketListWhere(filters),
        _count: { status: true },
      }),

      prisma.ticket.groupBy({
        by: ['priority'],
        where: buildTicketListWhere(filters),
        _count: { priority: true },
      }),

      prisma.ticket.count({
        where: {
          ...baseWhere,
          slaDueAt: { lt: new Date() },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),

      prisma.ticket.count({
        where: {
          ...baseWhere,
          assignedToId: null,
        },
      }),
    ]);

  const statusMap = byStatus.reduce(
    (acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    },
    {} as Record<string, number>,
  );

  const priorityMap = byPriority.reduce(
    (acc, item) => {
      acc[item.priority] = item._count.priority;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total,
    open: statusMap[TicketStatus.OPEN] ?? 0,
    inProgress: statusMap[TicketStatus.IN_PROGRESS] ?? 0,
    waitingCustomer: statusMap[TicketStatus.WAITING_CUSTOMER] ?? 0,
    escalated: statusMap[TicketStatus.ESCALATED] ?? 0,
    resolved: statusMap[TicketStatus.RESOLVED] ?? 0,
    closed: statusMap[TicketStatus.CLOSED] ?? 0,
    overdue: overdueCount,
    unassigned: unassignedCount,
    byStatus: statusMap as Record<string, number>,
    byPriority: priorityMap as Record<string, number>,
  };
}
