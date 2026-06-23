import { prisma } from '../../../../shared/database/prisma.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import {
  TicketHistoryEvent,
  TicketPriority,
} from '../../domain/ticket-enums.js';
import {
  type TicketHistoryRepository,
  ticketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type RouteTicketInput = {
  ticketId: string;
  tenantId: string;
  changedById?: string;
};

export type RouteTicketResult = {
  ticket: Ticket;
  routedTo: {
    id: string;
    name: string;
    role: string;
  };
  reason: string;
};

type AgentWorkload = {
  agentId: string;
  agentName: string;
  agentRole: string;
  activeTicketsCount: number;
};

export class RouteTicketUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly historyRepo: TicketHistoryRepository = ticketHistoryRepository,
    private readonly notificationService: NotificationEventService = notificationEventService,
  ) {}

  async execute(input: RouteTicketInput): Promise<RouteTicketResult> {
    const ticket = await this.ticketsRepo.findById(input.ticketId);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.tenantId !== input.tenantId) {
      throw new AppError('Invalid tenant for ticket', 403);
    }

    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      throw new AppError('Cannot route resolved or closed tickets', 400);
    }

    const category = ticket.categoryId
      ? await prisma.ticketCategory.findUnique({
          where: { id: ticket.categoryId },
        })
      : null;

    const eligibleAgents = await this.getEligibleAgents(
      input.tenantId,
      ticket.priority,
      category?.name,
    );

    if (eligibleAgents.length === 0) {
      throw new AppError('No eligible agents found for routing', 400);
    }

    const agentsWorkload = await this.calculateAgentsWorkload(
      eligibleAgents,
      input.tenantId,
    );

    const selectedAgent = this.selectBestAgent(agentsWorkload);

    const updatedTicket = await this.assignTicketToAgent(
      ticket,
      selectedAgent.agentId,
      input.tenantId,
      input.changedById,
    );

    const reason = this.buildRoutingReason(
      ticket.priority,
      category?.name,
      selectedAgent.agentRole,
    );

    return {
      ticket: updatedTicket,
      routedTo: {
        id: selectedAgent.agentId,
        name: selectedAgent.agentName,
        role: selectedAgent.agentRole,
      },
      reason,
    };
  }

  private async getEligibleAgents(
    tenantId: string,
    priority: string,
    categoryName?: string,
  ): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
    const isUrgentOrCritical = priority === TicketPriority.URGENT;
    const isOmbudsmanCategory =
      categoryName?.toLowerCase().includes('ouvidoria') ?? false;

    if (isUrgentOrCritical) {
      const seniorAgents = await prisma.user.findMany({
        where: {
          tenantId,
          role: UserRole.ADMIN,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (seniorAgents.length > 0) {
        return seniorAgents;
      }
    }

    if (isOmbudsmanCategory) {
      const ombudsmanAgents = await prisma.user.findMany({
        where: {
          tenantId,
          role: {
            in: [UserRole.OMBUDSMAN, UserRole.ADMIN, UserRole.SUPERVISOR],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (ombudsmanAgents.length > 0) {
        return ombudsmanAgents;
      }
    }

    return prisma.user.findMany({
      where: {
        tenantId,
        role: UserRole.AGENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  private async calculateAgentsWorkload(
    agents: Array<{ id: string; name: string; email: string; role: string }>,
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
        agentRole: agent.role,
        activeTicketsCount: activeCount,
      });
    }

    return workloads;
  }

  private selectBestAgent(workloads: AgentWorkload[]): AgentWorkload {
    if (workloads.length === 0) {
      throw new AppError('No available agents for routing', 400);
    }

    workloads.sort((a, b) => {
      if (a.activeTicketsCount !== b.activeTicketsCount) {
        return a.activeTicketsCount - b.activeTicketsCount;
      }

      const roleWeight: Record<string, number> = {
        [UserRole.ADMIN]: 1,
        [UserRole.SUPERVISOR]: 2,
        [UserRole.OMBUDSMAN]: 3,
        [UserRole.AGENT]: 4,
        [UserRole.CUSTOMER]: 5,
      };

      const weightA = roleWeight[a.agentRole] ?? 99;
      const weightB = roleWeight[b.agentRole] ?? 99;

      return weightA - weightB;
    });

    return workloads[0]!;
  }

  private async assignTicketToAgent(
    ticket: Ticket,
    agentId: string,
    tenantId: string,
    changedById?: string,
  ): Promise<Ticket> {
    const updatedTicket = await this.ticketsRepo.assignTo(ticket.id, agentId);

    const historyEvent =
      ticket.assignedToId === null
        ? TicketHistoryEvent.ASSIGNED
        : TicketHistoryEvent.ASSIGNED;

    await this.historyRepo.create({
      tenantId,
      ticketId: ticket.id,
      event: historyEvent,
      field: 'assignedToId',
      oldValue: ticket.assignedToId ?? undefined,
      newValue: agentId,
      changedById,
    });

    await this.notificationService.notifyTicketAssigned(updatedTicket, agentId);

    return updatedTicket;
  }

  private buildRoutingReason(
    priority: string,
    categoryName: string | undefined,
    agentRole: string,
  ): string {
    const reasons: string[] = [];

    if (priority === TicketPriority.URGENT) {
      reasons.push('Prioridade URGENT requer agente especializado');
    }

    if (categoryName?.toLowerCase().includes('ouvidoria')) {
      reasons.push('Categoria de Ouvidoria');
    }

    if (agentRole === UserRole.ADMIN) {
      reasons.push('Roteado para Administrador');
    } else {
      reasons.push('Roteado para agente com menor carga de trabalho');
    }

    return reasons.join('; ');
  }
}

export const routeTicketUseCase = new RouteTicketUseCase();
