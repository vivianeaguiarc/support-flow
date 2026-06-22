import type { Ticket, TicketPriority } from '@prisma/client';
import { TicketStatus, UserRole } from '@prisma/client';

import { AppError } from '../../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../users/repositories/users.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../repositories/tickets.repository.js';

export type CreateTicketServiceInput = {
  title: string;
  description: string;
  customerId: string;
  priority?: TicketPriority;
  assignedAgentId?: string;
};

export class TicketsService {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
  ) {}

  async create(
    data: CreateTicketServiceInput,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    this.assertCanCreateTicket(authUser, data);

    await this.ensureCustomer(data.customerId);

    if (data.assignedAgentId) {
      await this.ensureAgent(data.assignedAgentId);
    }

    const ticket = await this.ticketsRepository.create({
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      priority: data.priority,
      status: TicketStatus.OPEN,
    });

    if (data.assignedAgentId) {
      return this.ticketsRepository.assignAgent(
        ticket.id,
        data.assignedAgentId,
      );
    }

    return ticket;
  }

  async findById(id: string, authUser: AuthenticatedUser): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findById(id);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    this.assertCanAccessTicket(ticket, authUser);

    return ticket;
  }

  async list(authUser: AuthenticatedUser): Promise<Ticket[]> {
    if (authUser.role === UserRole.CUSTOMER) {
      return this.ticketsRepository.listByCustomerId(authUser.id);
    }

    return this.ticketsRepository.list();
  }

  async listByCustomerId(
    customerId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket[]> {
    this.assertCanListCustomerTickets(customerId, authUser);
    return this.ticketsRepository.listByCustomerId(customerId);
  }

  async listByAssignedAgentId(
    assignedAgentId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket[]> {
    this.assertCanListAgentTickets(assignedAgentId, authUser);
    return this.ticketsRepository.listByAssignedAgentId(assignedAgentId);
  }

  async updateStatus(
    id: string,
    status: TicketStatus,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    this.assertCanManageTickets(authUser);
    await this.findById(id, authUser);
    return this.ticketsRepository.updateStatus(id, status);
  }

  async assignAgent(
    id: string,
    assignedAgentId: string,
    authUser: AuthenticatedUser,
  ): Promise<Ticket> {
    this.assertCanManageTickets(authUser);
    await this.findById(id, authUser);
    await this.ensureAgent(assignedAgentId);
    return this.ticketsRepository.assignAgent(id, assignedAgentId);
  }

  private assertCanCreateTicket(
    authUser: AuthenticatedUser,
    data: CreateTicketServiceInput,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.CUSTOMER) {
      if (data.customerId !== authUser.id) {
        throw new AppError('Forbidden', 403);
      }

      if (data.assignedAgentId) {
        throw new AppError('Customers cannot assign agents', 400);
      }

      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanAccessTicket(
    ticket: Ticket,
    authUser: AuthenticatedUser,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.AGENT) {
      return;
    }

    if (
      authUser.role === UserRole.CUSTOMER &&
      ticket.customerId === authUser.id
    ) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanListCustomerTickets(
    customerId: string,
    authUser: AuthenticatedUser,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.CUSTOMER && customerId === authUser.id) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanListAgentTickets(
    agentId: string,
    authUser: AuthenticatedUser,
  ): void {
    if (authUser.role === UserRole.ADMIN) {
      return;
    }

    if (authUser.role === UserRole.AGENT && agentId === authUser.id) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private assertCanManageTickets(authUser: AuthenticatedUser): void {
    if (authUser.role === UserRole.ADMIN || authUser.role === UserRole.AGENT) {
      return;
    }

    throw new AppError('Forbidden', 403);
  }

  private async ensureCustomer(customerId: string): Promise<void> {
    const customer = await this.usersRepository.findById(customerId);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    if (customer.role !== UserRole.CUSTOMER) {
      throw new AppError('User must have CUSTOMER role', 400);
    }
  }

  private async ensureAgent(agentId: string): Promise<void> {
    const agent = await this.usersRepository.findById(agentId);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.role !== UserRole.AGENT) {
      throw new AppError('User must have AGENT role', 400);
    }
  }
}

export const ticketsService = new TicketsService();
