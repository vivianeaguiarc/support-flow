import type { Ticket } from '@prisma/client';
import { TicketHistoryEvent, TicketStatus, UserRole } from '@prisma/client';

import { AppError } from '../../../../shared/errors/app-error.js';
import {
  CustomersRepository,
  customersRepository as defaultCustomersRepository,
} from '../../../customers/repositories/customers.repository.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import { generateTicketProtocol } from '../../domain/ticket-protocol.js';
import {
  TicketCategoriesRepository,
  ticketCategoriesRepository as defaultTicketCategoriesRepository,
} from '../../repositories/ticket-categories.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../repositories/tickets.repository.js';
import type { OpenTicketInput } from '../inputs/ticket-use-case.inputs.js';
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
  ) {}

  async execute(input: OpenTicketInput): Promise<Ticket> {
    await this.ensureCustomer(input.customerId, input.tenantId);

    if (input.categoryId) {
      await this.ensureCategory(input.categoryId, input.tenantId);
    }

    if (input.assignedToId) {
      await this.ensureAgent(input.assignedToId, input.tenantId);
    }

    const slaDueAt = await this.calculateTicketSla.execute({
      tenantId: input.tenantId,
      priority: input.priority,
      categoryId: input.categoryId,
    });

    const ticket = await this.ticketsRepository.create({
      tenantId: input.tenantId,
      protocol: generateTicketProtocol(),
      title: input.title,
      description: input.description,
      customerId: input.customerId,
      priority: input.priority,
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

    return ticket;
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
    const agent = await this.usersRepository.findById(agentId);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.tenantId !== tenantId) {
      throw new AppError('Invalid tenant for agent', 403);
    }

    if (agent.role !== UserRole.AGENT && agent.role !== UserRole.ADMIN) {
      throw new AppError('User must have AGENT role', 400);
    }
  }
}

export const openTicketUseCase = new OpenTicketUseCase();
