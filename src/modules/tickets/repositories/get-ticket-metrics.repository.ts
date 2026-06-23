import { prisma } from '../../../shared/database/prisma.js';
import { TicketStatus } from '../domain/ticket-enums.js';
import type {
  AgentPerformance,
  TicketMetrics,
} from '../domain/ticket-metrics.js';

export type GetTicketMetricsFilters = {
  tenantId: string;
  categoryId?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

export async function getTicketMetrics(
  filters: GetTicketMetricsFilters,
): Promise<TicketMetrics> {
  const baseWhere: {
    tenantId: string;
    categoryId?: string;
    createdAt?: { gte?: Date; lte?: Date };
  } = {
    tenantId: filters.tenantId,
  };

  if (filters.categoryId) {
    baseWhere.categoryId = filters.categoryId;
  }

  if (filters.createdFrom || filters.createdTo) {
    baseWhere.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }

  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      ...baseWhere,
      status: TicketStatus.RESOLVED,
      closedAt: { not: null },
    },
    select: {
      id: true,
      createdAt: true,
      closedAt: true,
      slaDueAt: true,
      assignedToId: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const overdueTickets = await prisma.ticket.count({
    where: {
      ...baseWhere,
      slaDueAt: { lt: new Date() },
      status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
    },
  });

  let avgResolutionTimeHours = 0;
  let slaComplianceRate = 0;

  if (resolvedTickets.length > 0) {
    const totalResolutionTimeMs = resolvedTickets.reduce((sum, ticket) => {
      if (ticket.closedAt) {
        return sum + (ticket.closedAt.getTime() - ticket.createdAt.getTime());
      }
      return sum;
    }, 0);

    avgResolutionTimeHours =
      totalResolutionTimeMs / resolvedTickets.length / (1000 * 60 * 60);

    const ticketsResolvedBeforeSla = resolvedTickets.filter(
      (ticket) =>
        ticket.closedAt &&
        ticket.slaDueAt &&
        ticket.closedAt <= ticket.slaDueAt,
    ).length;

    slaComplianceRate =
      (ticketsResolvedBeforeSla / resolvedTickets.length) * 100;
  }

  const agentPerformanceMap = new Map<
    string,
    {
      agentName: string;
      tickets: Array<{ createdAt: Date; closedAt: Date }>;
    }
  >();

  resolvedTickets.forEach((ticket) => {
    if (ticket.assignedToId && ticket.closedAt && ticket.assignedTo) {
      if (!agentPerformanceMap.has(ticket.assignedToId)) {
        agentPerformanceMap.set(ticket.assignedToId, {
          agentName: ticket.assignedTo.name,
          tickets: [],
        });
      }
      agentPerformanceMap.get(ticket.assignedToId)!.tickets.push({
        createdAt: ticket.createdAt,
        closedAt: ticket.closedAt,
      });
    }
  });

  const agentPerformance: AgentPerformance[] = Array.from(
    agentPerformanceMap.entries(),
  ).map(([agentId, data]) => {
    const totalTimeMs = data.tickets.reduce(
      (sum, ticket) =>
        sum + (ticket.closedAt.getTime() - ticket.createdAt.getTime()),
      0,
    );
    const avgTimeHours = totalTimeMs / data.tickets.length / (1000 * 60 * 60);

    return {
      agentId,
      agentName: data.agentName,
      resolvedTickets: data.tickets.length,
      avgResolutionTimeHours: Math.round(avgTimeHours * 100) / 100,
    };
  });

  agentPerformance.sort((a, b) => b.resolvedTickets - a.resolvedTickets);

  return {
    avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 100) / 100,
    slaComplianceRate: Math.round(slaComplianceRate * 100) / 100,
    resolvedTickets: resolvedTickets.length,
    overdueTickets,
    agentPerformance,
  };
}
