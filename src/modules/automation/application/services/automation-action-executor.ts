import { prisma } from '../../../../shared/database/prisma.js';
import { canBeAssignedTickets } from '../../../../shared/security/rbac.js';
import {
  type CreateNotificationUseCase,
  createNotificationUseCase,
} from '../../../notifications/application/use-cases/create-notification.use-case.js';
import { NotificationType } from '../../../notifications/domain/notification-types.js';
import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import {
  TicketHistoryEvent,
  TicketStatus,
} from '../../../tickets/domain/ticket-enums.js';
import type { AssigneeTeamRole } from '../../../tickets/domain/ticket-queue-filters.js';
import { assertValidTicketStatusTransition } from '../../../tickets/domain/ticket-status-transitions.js';
import {
  type TicketHistoryRepository,
  ticketHistoryRepository,
} from '../../../tickets/infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../../tickets/infrastructure/repositories/tickets.repository.js';
import {
  type AutomationAction,
  AutomationActionType,
} from '../../domain/automation-action.js';

export type ActionExecutionResult = {
  action: AutomationAction;
  success: boolean;
  message?: string;
};

export class AutomationActionExecutor {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly historyRepo: TicketHistoryRepository = ticketHistoryRepository,
    private readonly createNotification: CreateNotificationUseCase = createNotificationUseCase,
  ) {}

  async executeAll(
    actions: AutomationAction[],
    ticket: Ticket,
  ): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];
    let currentTicket = ticket;

    for (const action of actions) {
      const result = await this.executeAction(action, currentTicket);
      results.push(result);

      const refreshed = await this.ticketsRepo.findById(currentTicket.id);
      if (refreshed) {
        currentTicket = refreshed;
      }
    }

    return results;
  }

  private async executeAction(
    action: AutomationAction,
    ticket: Ticket,
  ): Promise<ActionExecutionResult> {
    try {
      switch (action.type) {
        case AutomationActionType.ASSIGN_AGENT:
          return await this.assignAgent(ticket, action.agentId);
        case AutomationActionType.ASSIGN_TEAM:
          return await this.assignTeam(ticket, action.team);
        case AutomationActionType.CHANGE_PRIORITY:
          return await this.changePriority(ticket, action.priority);
        case AutomationActionType.SEND_NOTIFICATION:
          return await this.sendNotification(ticket, action);
        case AutomationActionType.CLOSE_TICKET:
          return await this.closeTicket(ticket);
        default:
          return {
            action,
            success: false,
            message: 'Unsupported action type',
          };
      }
    } catch (error) {
      return {
        action,
        success: false,
        message: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  private async assignAgent(
    ticket: Ticket,
    agentId: string,
  ): Promise<ActionExecutionResult> {
    if (ticket.assignedToId === agentId) {
      return {
        action: { type: AutomationActionType.ASSIGN_AGENT, agentId },
        success: true,
        message: 'Ticket already assigned to agent',
      };
    }

    const agent = await prisma.user.findFirst({
      where: { id: agentId, tenantId: ticket.tenantId },
    });

    if (!agent || !canBeAssignedTickets(agent.role)) {
      return {
        action: { type: AutomationActionType.ASSIGN_AGENT, agentId },
        success: false,
        message: 'Agent not found or not assignable',
      };
    }

    await this.ticketsRepo.assignTo(ticket.id, agentId);
    await this.historyRepo.create({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      event: ticket.assignedToId
        ? TicketHistoryEvent.REASSIGNED
        : TicketHistoryEvent.ASSIGNED,
      field: 'assignedToId',
      oldValue: ticket.assignedToId ?? undefined,
      newValue: agentId,
      metadata: { source: 'automation' },
    });

    return {
      action: { type: AutomationActionType.ASSIGN_AGENT, agentId },
      success: true,
    };
  }

  private async assignTeam(
    ticket: Ticket,
    team: AssigneeTeamRole,
  ): Promise<ActionExecutionResult> {
    const agents = await prisma.user.findMany({
      where: {
        tenantId: ticket.tenantId,
        role: team,
      },
      select: { id: true, role: true },
    });

    const eligibleAgents = agents.filter((agent) =>
      canBeAssignedTickets(agent.role),
    );

    if (eligibleAgents.length === 0) {
      return {
        action: { type: AutomationActionType.ASSIGN_TEAM, team },
        success: false,
        message: 'No eligible agents found for team',
      };
    }

    const workloads = await Promise.all(
      eligibleAgents.map(async (agent) => ({
        agentId: agent.id,
        count: await this.ticketsRepo.countActiveTicketsByAgent(
          agent.id,
          ticket.tenantId,
        ),
      })),
    );

    workloads.sort((left, right) => left.count - right.count);
    const selectedAgentId = workloads[0]!.agentId;

    return this.assignAgent(ticket, selectedAgentId);
  }

  private async changePriority(
    ticket: Ticket,
    priority: Ticket['priority'],
  ): Promise<ActionExecutionResult> {
    if (ticket.priority === priority) {
      return {
        action: { type: AutomationActionType.CHANGE_PRIORITY, priority },
        success: true,
        message: 'Priority already set',
      };
    }

    await this.ticketsRepo.updatePriority(ticket.id, priority);
    await this.historyRepo.create({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.PRIORITY_CHANGED,
      field: 'priority',
      oldValue: ticket.priority,
      newValue: priority,
      metadata: { source: 'automation' },
    });

    return {
      action: { type: AutomationActionType.CHANGE_PRIORITY, priority },
      success: true,
    };
  }

  private async sendNotification(
    ticket: Ticket,
    action: Extract<
      AutomationAction,
      { type: typeof AutomationActionType.SEND_NOTIFICATION }
    >,
  ): Promise<ActionExecutionResult> {
    const recipientId = action.recipientId ?? ticket.assignedToId;

    if (!recipientId) {
      return {
        action,
        success: false,
        message: 'Notification recipient not available',
      };
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: action.title,
      message: action.message,
    });

    return { action, success: true };
  }

  private async closeTicket(ticket: Ticket): Promise<ActionExecutionResult> {
    if (ticket.status === TicketStatus.CLOSED) {
      return {
        action: { type: AutomationActionType.CLOSE_TICKET },
        success: true,
        message: 'Ticket already closed',
      };
    }

    let currentStatus = ticket.status;

    if (currentStatus !== TicketStatus.RESOLVED) {
      if (
        !this.canTransition(currentStatus, TicketStatus.RESOLVED) &&
        !this.canTransition(currentStatus, TicketStatus.CLOSED)
      ) {
        return {
          action: { type: AutomationActionType.CLOSE_TICKET },
          success: false,
          message: 'Ticket cannot be closed from current status',
        };
      }

      if (this.canTransition(currentStatus, TicketStatus.RESOLVED)) {
        await this.updateStatusWithHistory(
          ticket,
          currentStatus,
          TicketStatus.RESOLVED,
        );
        currentStatus = TicketStatus.RESOLVED;
      }
    }

    if (!this.canTransition(currentStatus, TicketStatus.CLOSED)) {
      return {
        action: { type: AutomationActionType.CLOSE_TICKET },
        success: false,
        message: 'Ticket cannot be closed from current status',
      };
    }

    await this.updateStatusWithHistory(
      ticket,
      currentStatus,
      TicketStatus.CLOSED,
    );

    return {
      action: { type: AutomationActionType.CLOSE_TICKET },
      success: true,
    };
  }

  private canTransition(from: TicketStatus, to: TicketStatus): boolean {
    try {
      assertValidTicketStatusTransition(from, to);
      return true;
    } catch {
      return false;
    }
  }

  private async updateStatusWithHistory(
    ticket: Ticket,
    oldStatus: TicketStatus,
    newStatus: TicketStatus,
  ): Promise<void> {
    await this.ticketsRepo.updateStatus(ticket.id, newStatus);
    await this.historyRepo.create({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.STATUS_CHANGED,
      field: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      metadata: { source: 'automation' },
    });
  }
}

export const automationActionExecutor = new AutomationActionExecutor();
