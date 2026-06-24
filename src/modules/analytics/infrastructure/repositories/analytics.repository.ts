import { prisma } from '../../../../shared/database/prisma.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import {
  TicketPriority,
  TicketStatus,
} from '../../../tickets/domain/ticket-enums.js';
import {
  resolveTicketSlaStatus,
  TicketSlaStatus,
} from '../../../tickets/domain/ticket-sla-status.js';
import type { AnalyticsFilters } from '../../domain/analytics-filters.js';
import type {
  AnalyticsAgentsPerformance,
  AnalyticsOverview,
  AnalyticsSla,
  AnalyticsTicketsByPriority,
  AnalyticsTicketsByStatus,
} from '../../domain/analytics-types.js';
import {
  calculateResolutionMetrics,
  groupTicketsByPeriod,
} from './analytics-resolution.js';
import { buildAnalyticsWhere } from './build-analytics-where.js';

const ACTIVE_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_CUSTOMER,
  TicketStatus.ESCALATED,
];

const RESOLVED_STATUSES: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
];

function toStatusMap(
  rows: Array<{ status: TicketStatus; _count: { status: number } }>,
): Record<TicketStatus, number> {
  const map = Object.values(TicketStatus).reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    {} as Record<TicketStatus, number>,
  );

  for (const row of rows) {
    map[row.status] = row._count.status;
  }

  return map;
}

function toPriorityMap(
  rows: Array<{ priority: TicketPriority; _count: { priority: number } }>,
): Record<TicketPriority, number> {
  const map = Object.values(TicketPriority).reduce(
    (acc, priority) => {
      acc[priority] = 0;
      return acc;
    },
    {} as Record<TicketPriority, number>,
  );

  for (const row of rows) {
    map[row.priority] = row._count.priority;
  }

  return map;
}

export class AnalyticsRepository {
  async getOverview(filters: AnalyticsFilters): Promise<AnalyticsOverview> {
    const where = buildAnalyticsWhere(filters);
    const now = new Date();

    const [
      totalTickets,
      byStatus,
      slaBreachedTickets,
      resolvedTickets,
      createdTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.ticket.count({
        where: {
          ...where,
          slaDueAt: { lt: now },
          status: { notIn: RESOLVED_STATUSES },
        },
      }),
      prisma.ticket.findMany({
        where: {
          ...where,
          status: { in: RESOLVED_STATUSES },
        },
        select: {
          createdAt: true,
          closedAt: true,
          updatedAt: true,
          slaDueAt: true,
        },
      }),
      prisma.ticket.findMany({
        where,
        select: { createdAt: true },
      }),
    ]);

    const statusMap = toStatusMap(byStatus);
    const resolutionMetrics = calculateResolutionMetrics(resolvedTickets);

    return {
      totalTickets,
      openTickets: statusMap[TicketStatus.OPEN],
      inProgressTickets: statusMap[TicketStatus.IN_PROGRESS],
      resolvedTickets: statusMap[TicketStatus.RESOLVED],
      closedTickets: statusMap[TicketStatus.CLOSED],
      slaBreachedTickets,
      slaComplianceRate: resolutionMetrics.slaComplianceRate,
      avgResolutionTimeHours: resolutionMetrics.avgResolutionTimeHours,
      ticketsCreatedByPeriod: groupTicketsByPeriod(createdTickets),
    };
  }

  async getTicketsByStatus(
    filters: AnalyticsFilters,
  ): Promise<AnalyticsTicketsByStatus> {
    const where = buildAnalyticsWhere(filters);

    const [total, byStatus] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    return {
      total,
      byStatus: toStatusMap(byStatus),
    };
  }

  async getTicketsByPriority(
    filters: AnalyticsFilters,
  ): Promise<AnalyticsTicketsByPriority> {
    const where = buildAnalyticsWhere(filters);

    const [total, byPriority] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: { priority: true },
      }),
    ]);

    return {
      total,
      byPriority: toPriorityMap(byPriority),
    };
  }

  async getSla(filters: AnalyticsFilters): Promise<AnalyticsSla> {
    const where = buildAnalyticsWhere(filters);
    const now = new Date();

    const [activeTickets, resolvedTickets, slaBreachedTickets] =
      await Promise.all([
        prisma.ticket.findMany({
          where: {
            ...where,
            slaDueAt: { not: null },
            status: { in: ACTIVE_STATUSES },
          },
          select: { slaDueAt: true },
        }),
        prisma.ticket.findMany({
          where: {
            ...where,
            status: { in: RESOLVED_STATUSES },
            slaDueAt: { not: null },
          },
          select: {
            createdAt: true,
            closedAt: true,
            updatedAt: true,
            slaDueAt: true,
          },
        }),
        prisma.ticket.count({
          where: {
            ...where,
            slaDueAt: { lt: now },
            status: { notIn: RESOLVED_STATUSES },
          },
        }),
      ]);

    let onTime = 0;
    let warning = 0;
    let breached = 0;

    for (const ticket of activeTickets) {
      if (!ticket.slaDueAt) {
        continue;
      }

      const status = resolveTicketSlaStatus(ticket.slaDueAt, now);

      if (status === TicketSlaStatus.ON_TIME) {
        onTime += 1;
      } else if (status === TicketSlaStatus.WARNING) {
        warning += 1;
      } else {
        breached += 1;
      }
    }

    const resolutionMetrics = calculateResolutionMetrics(resolvedTickets);

    return {
      onTime,
      warning,
      breached,
      total: onTime + warning + breached,
      slaComplianceRate: resolutionMetrics.slaComplianceRate,
      slaBreachedTickets,
    };
  }

  async getAgentsPerformance(
    filters: AnalyticsFilters,
  ): Promise<AnalyticsAgentsPerformance> {
    const where = buildAnalyticsWhere(filters);
    const now = new Date();

    const agents = await prisma.user.findMany({
      where: {
        tenantId: filters.tenantId,
        role: UserRole.AGENT,
        ...(filters.agentId ? { id: filters.agentId } : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    const [groupedByAgentStatus, resolvedTickets, slaBreachedByAgent] =
      await Promise.all([
        prisma.ticket.groupBy({
          by: ['assignedToId', 'status'],
          where: {
            ...where,
            assignedToId: { not: null },
          },
          _count: { status: true },
        }),
        prisma.ticket.findMany({
          where: {
            ...where,
            status: { in: RESOLVED_STATUSES },
            assignedToId: { not: null },
          },
          select: {
            assignedToId: true,
            createdAt: true,
            closedAt: true,
            updatedAt: true,
            slaDueAt: true,
          },
        }),
        prisma.ticket.groupBy({
          by: ['assignedToId'],
          where: {
            ...where,
            assignedToId: { not: null },
            slaDueAt: { lt: now },
            status: { in: ACTIVE_STATUSES },
          },
          _count: { assignedToId: true },
        }),
      ]);

    const statusCountsByAgent = new Map<string, Map<TicketStatus, number>>();

    for (const row of groupedByAgentStatus) {
      if (!row.assignedToId) {
        continue;
      }

      if (!statusCountsByAgent.has(row.assignedToId)) {
        statusCountsByAgent.set(row.assignedToId, new Map());
      }

      statusCountsByAgent
        .get(row.assignedToId)!
        .set(row.status, row._count.status);
    }

    const resolvedByAgent = new Map<
      string,
      Array<{
        createdAt: Date;
        closedAt: Date | null;
        updatedAt: Date;
        slaDueAt: Date | null;
      }>
    >();

    for (const ticket of resolvedTickets) {
      if (!ticket.assignedToId) {
        continue;
      }

      if (!resolvedByAgent.has(ticket.assignedToId)) {
        resolvedByAgent.set(ticket.assignedToId, []);
      }

      resolvedByAgent.get(ticket.assignedToId)!.push(ticket);
    }

    const slaBreachedMap = new Map<string, number>();

    for (const row of slaBreachedByAgent) {
      if (row.assignedToId) {
        slaBreachedMap.set(row.assignedToId, row._count.assignedToId);
      }
    }

    const performance = agents.map((agent) => {
      const statusCounts = statusCountsByAgent.get(agent.id) ?? new Map();
      const assignedTickets = Array.from(statusCounts.values()).reduce(
        (sum, count) => sum + count,
        0,
      );
      const resolvedCount =
        (statusCounts.get(TicketStatus.RESOLVED) ?? 0) +
        (statusCounts.get(TicketStatus.CLOSED) ?? 0);
      const openTickets = ACTIVE_STATUSES.reduce(
        (sum, status) => sum + (statusCounts.get(status) ?? 0),
        0,
      );

      const agentResolvedTickets = resolvedByAgent.get(agent.id) ?? [];
      const resolutionMetrics =
        calculateResolutionMetrics(agentResolvedTickets);

      return {
        agentId: agent.id,
        agentName: agent.name,
        assignedTickets,
        resolvedTickets: resolvedCount,
        openTickets,
        slaBreachedTickets: slaBreachedMap.get(agent.id) ?? 0,
        avgResolutionTimeHours: resolutionMetrics.avgResolutionTimeHours,
      };
    });

    return { agents: performance };
  }
}

export const analyticsRepository = new AnalyticsRepository();
