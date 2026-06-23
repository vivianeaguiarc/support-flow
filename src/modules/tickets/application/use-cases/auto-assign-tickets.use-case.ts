import { prisma } from '../../../../shared/database/prisma.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/services/notification-event.service.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  type TicketHistoryRepository,
  ticketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../repositories/tickets.repository.js';

export type AutoAssignTicketsResult = {
  ticketsProcessed: number;
  ticketsAssigned: number;
  failedAssignments: number;
};

export type AgentWorkload = {
  agentId: string;
  agentName: string;
  activeTicketsCount: number;
};

export class AutoAssignTicketsUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly historyRepo: TicketHistoryRepository = ticketHistoryRepository,
    private readonly notificationService: NotificationEventService = notificationEventService,
  ) {}

  async execute(tenantId: string): Promise<AutoAssignTicketsResult> {
    const unassignedTickets =
      await this.ticketsRepo.findUnassignedOpenTickets(tenantId);

    if (unassignedTickets.length === 0) {
      return {
        ticketsProcessed: 0,
        ticketsAssigned: 0,
        failedAssignments: 0,
      };
    }

    const eligibleAgents = await this.getEligibleAgents(tenantId);

    if (eligibleAgents.length === 0) {
      console.warn(
        `[Auto-Assign] No eligible agents found for tenant ${tenantId}`,
      );
      return {
        ticketsProcessed: unassignedTickets.length,
        ticketsAssigned: 0,
        failedAssignments: unassignedTickets.length,
      };
    }

    const agentsWorkload = await this.calculateAgentsWorkload(
      eligibleAgents,
      tenantId,
    );

    let ticketsAssigned = 0;
    let failedAssignments = 0;

    for (const ticket of unassignedTickets) {
      try {
        const selectedAgent = this.selectAgentWithLeastWorkload(agentsWorkload);

        await this.assignTicketToAgent(ticket, selectedAgent.agentId, tenantId);

        selectedAgent.activeTicketsCount++;
        ticketsAssigned++;
      } catch (error) {
        console.error(
          `[Auto-Assign] Failed to assign ticket ${ticket.id}:`,
          error,
        );
        failedAssignments++;
      }
    }

    return {
      ticketsProcessed: unassignedTickets.length,
      ticketsAssigned,
      failedAssignments,
    };
  }

  private async getEligibleAgents(tenantId: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.AGENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  private async calculateAgentsWorkload(
    agents: Array<{ id: string; name: string; email: string }>,
    tenantId: string,
  ): Promise<AgentWorkload[]> {
    const workloads: AgentWorkload[] = [];

    for (const agent of agents) {
      const activeCount = await this.ticketsRepo.countActiveTicketsByAgent(
        agent.id,
        tenantId,
      );

      workloads.push({
        agentId: agent.id,
        agentName: agent.name,
        activeTicketsCount: activeCount,
      });
    }

    return workloads.sort(
      (a, b) => a.activeTicketsCount - b.activeTicketsCount,
    );
  }

  private selectAgentWithLeastWorkload(
    workloads: AgentWorkload[],
  ): AgentWorkload {
    workloads.sort((a, b) => a.activeTicketsCount - b.activeTicketsCount);
    return workloads[0];
  }

  private async assignTicketToAgent(
    ticket: Ticket,
    agentId: string,
    tenantId: string,
  ): Promise<void> {
    const updatedTicket = await this.ticketsRepo.assignTo(ticket.id, agentId);

    await this.historyRepo.create({
      tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.ASSIGNED,
      field: 'assignedToId',
      oldValue: null,
      newValue: agentId,
      changedById: null,
    });

    await this.notificationService.notifyTicketAssigned(updatedTicket, agentId);
  }
}

export const autoAssignTicketsUseCase = new AutoAssignTicketsUseCase();
