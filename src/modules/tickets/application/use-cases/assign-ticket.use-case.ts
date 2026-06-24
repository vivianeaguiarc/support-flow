import { AppError } from '../../../../shared/errors/app-error.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import { canBeAssignedTickets } from '../../../../shared/security/rbac.js';
import {
  type AutomationEngine,
  automationEngine,
} from '../../../automation/application/services/automation-engine.js';
import { AutomationTrigger } from '../../../automation/domain/automation-trigger.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import {
  assertTicketAssignable,
  resolveAssignmentHistoryEvent,
} from '../../domain/assign-ticket.rules.js';
import { type Ticket } from '../../domain/index.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { AssignTicketInput } from '../inputs/ticket-use-case.inputs.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export class AssignTicketUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
    private readonly notificationService: NotificationEventService = notificationEventService,
    private readonly automation: AutomationEngine = automationEngine,
  ) {}

  async execute(input: AssignTicketInput): Promise<Ticket> {
    const ticket = await this.findTicket.execute({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
    });

    assertTicketAssignable(ticket.status);

    await this.ensureAgent(input.assignedToId, input.tenantId);

    const updatedTicket = await this.ticketsRepository.assignTo(
      ticket.id,
      input.assignedToId,
    );

    await this.ticketHistoryRepository.create({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      event: resolveAssignmentHistoryEvent(ticket.assignedToId),
      field: 'assignedToId',
      oldValue: ticket.assignedToId ?? undefined,
      newValue: input.assignedToId,
      changedById: input.changedById,
    });

    if (ticket.assignedToId) {
      await this.notificationService.notifyTicketReassigned(
        updatedTicket,
        input.assignedToId,
      );
    } else {
      await this.notificationService.notifyTicketAssigned(
        updatedTicket,
        input.assignedToId,
      );
    }

    logBusinessEvent(BusinessEvent.TICKET_ASSIGNED, {
      tenantId: input.tenantId,
      ticketId: ticket.id,
      fromAssigneeId: ticket.assignedToId,
      toAssigneeId: input.assignedToId,
      actorId: input.changedById,
    });

    await this.automation.processEvent({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      trigger: AutomationTrigger.TICKET_UPDATED,
      ticket: updatedTicket,
      previousTicket: { assignedToId: ticket.assignedToId },
      actorId: input.changedById,
    });

    return updatedTicket;
  }

  private async ensureAgent(agentId: string, tenantId: string): Promise<void> {
    const agent = await this.usersRepository.findById(agentId, tenantId);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.tenantId !== tenantId) {
      throw new AppError('Invalid tenant for agent', 403);
    }

    if (!canBeAssignedTickets(agent.role)) {
      throw new AppError('User must have an assignable staff role', 400);
    }
  }
}

export const assignTicketUseCase = new AssignTicketUseCase();
