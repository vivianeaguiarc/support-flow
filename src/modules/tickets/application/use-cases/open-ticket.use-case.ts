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
  CustomersRepository,
  customersRepository as defaultCustomersRepository,
} from '../../../customers/repositories/customers.repository.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import {
  type Ticket,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../../domain/index.js';
import { generateTicketProtocol } from '../../domain/ticket-protocol.js';
import {
  TicketCategoriesRepository,
  ticketCategoriesRepository as defaultTicketCategoriesRepository,
} from '../../infrastructure/repositories/ticket-categories.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { OpenTicketInput } from '../inputs/ticket-use-case.inputs.js';
import {
  type CalculateTicketPriorityUseCase,
  calculateTicketPriorityUseCase,
} from './calculate-ticket-priority.use-case.js';
import {
  CalculateTicketSlaUseCase,
  calculateTicketSlaUseCase,
} from './calculate-ticket-sla.use-case.js';

export class OpenTicketUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly customersRepository: CustomersRepository = defaultCustomersRepository,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
    private readonly ticketCategoriesRepository: TicketCategoriesRepository = defaultTicketCategoriesRepository,
    private readonly calculateTicketSla: CalculateTicketSlaUseCase = calculateTicketSlaUseCase,
    private readonly calculateTicketPriority: CalculateTicketPriorityUseCase = calculateTicketPriorityUseCase,
    private readonly notificationService: NotificationEventService = notificationEventService,
    private readonly automation: AutomationEngine = automationEngine,
  ) {}

  async execute(input: OpenTicketInput): Promise<Ticket> {
    await this.ensureCustomer(input.customerId, input.tenantId);

    if (input.categoryId) {
      await this.ensureCategory(input.categoryId, input.tenantId);
    }

    if (input.assignedToId) {
      await this.ensureAgent(input.assignedToId, input.tenantId);
    }

    const priorityResult = await this.calculateTicketPriority.execute({
      tenantId: input.tenantId,
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      currentPriority: input.priority,
      manuallySet: false,
    });

    const finalPriority = priorityResult.suggestedPriority as TicketPriority;

    const slaDueAt = await this.calculateTicketSla.execute({
      tenantId: input.tenantId,
      priority: finalPriority,
      categoryId: input.categoryId,
    });

    const ticket = await this.ticketsRepository.create({
      tenantId: input.tenantId,
      protocol: generateTicketProtocol(),
      title: input.title,
      description: input.description,
      customerId: input.customerId,
      priority: finalPriority,
      categoryId: input.categoryId,
      assignedToId: input.assignedToId,
      slaDueAt,
      status: TicketStatus.OPEN,
    });

    await this.ticketHistoryRepository.create({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.CREATED,
      changedById: input.changedById,
    });

    if (priorityResult.priorityChanged && input.priority !== finalPriority) {
      await this.ticketHistoryRepository.create({
        tenantId: input.tenantId,
        ticketId: ticket.id,
        event: TicketHistoryEvent.PRIORITY_CHANGED,
        field: 'priority',
        oldValue: input.priority || TicketPriority.LOW,
        newValue: finalPriority,
      });
    }

    if (input.assignedToId) {
      await this.ticketHistoryRepository.create({
        tenantId: input.tenantId,
        ticketId: ticket.id,
        event: TicketHistoryEvent.ASSIGNED,
        field: 'assignedToId',
        oldValue: undefined,
        newValue: input.assignedToId,
        changedById: input.changedById,
      });
    }

    await this.notificationService.notifyTicketCreated(
      ticket,
      input.customerId,
    );

    logBusinessEvent(BusinessEvent.TICKET_CREATED, {
      tenantId: input.tenantId,
      ticketId: ticket.id,
      protocol: ticket.protocol,
      customerId: input.customerId,
      priority: finalPriority,
      actorId: input.changedById,
      assignedToId: input.assignedToId,
    });

    await this.automation.processEvent({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      trigger: AutomationTrigger.TICKET_CREATED,
      ticket,
      actorId: input.changedById,
    });

    const refreshedTicket = await this.ticketsRepository.findById(ticket.id);

    return refreshedTicket ?? ticket;
  }

  private async ensureCustomer(
    customerId: string,
    tenantId: string,
  ): Promise<void> {
    const customer = await this.customersRepository.findById(customerId);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (customer.tenantId !== tenantId) {
      throw new AppError('Invalid tenant for customer', 403);
    }

    if (!customer.isActive) {
      throw new AppError('Customer is inactive', 400);
    }
  }

  private async ensureCategory(
    categoryId: string,
    tenantId: string,
  ): Promise<void> {
    const category = await this.ticketCategoriesRepository.findByIdAndTenant(
      categoryId,
      tenantId,
    );

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (!category.isActive) {
      throw new AppError('Category is inactive', 400);
    }
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

export const openTicketUseCase = new OpenTicketUseCase();
