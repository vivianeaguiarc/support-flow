import { prisma } from '../../../../shared/database/prisma.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { AgentMetricsResult } from '../../domain/agent-metrics.js';
import { TicketStatus } from '../../domain/ticket-enums.js';

export async function getAgentMetrics(
  tenantId: string,
): Promise<AgentMetricsResult> {
  const agents = await prisma.user.findMany({
    where: {
      tenantId,
      role: UserRole.AGENT,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  });

  const now = new Date();
  const activeStatuses: TicketStatus[] = [
    TicketStatus.OPEN,
    TicketStatus.IN_PROGRESS,
    TicketStatus.WAITING_CUSTOMER,
    TicketStatus.ESCALATED,
  ];

  const agentMetrics = await Promise.all(
    agents.map(async (agent) => {
      const [
        assignedTickets,
        resolvedTickets,
        openTickets,
        slaBreachedTickets,
      ] = await Promise.all([
        prisma.ticket.count({
          where: {
            tenantId,
            assignedToId: agent.id,
          },
        }),
        prisma.ticket.count({
          where: {
            tenantId,
            assignedToId: agent.id,
            status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          },
        }),
        prisma.ticket.count({
          where: {
            tenantId,
            assignedToId: agent.id,
            status: { in: activeStatuses },
          },
        }),
        prisma.ticket.count({
          where: {
            tenantId,
            assignedToId: agent.id,
            slaDueAt: { lt: now },
            status: { in: activeStatuses },
          },
        }),
      ]);

      return {
        agentId: agent.id,
        agentName: agent.name,
        assignedTickets,
        resolvedTickets,
        openTickets,
        slaBreachedTickets,
      };
    }),
  );

  return { agents: agentMetrics };
}
