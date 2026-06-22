import type { Ticket, TicketPriority } from '@prisma/client';
import { TicketStatus, UserRole } from '@prisma/client';

import { AppError } from '../../../shared/errors/app-error.js';
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

  async create(data: CreateTicketServiceInput): Promise<Ticket> {
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

  async findById(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findById(id);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    return ticket;
  }

  async list(): Promise<Ticket[]> {
    return this.ticketsRepository.list();
  }

  async listByCustomerId(customerId: string): Promise<Ticket[]> {
    return this.ticketsRepository.listByCustomerId(customerId);
  }

  async listByAssignedAgentId(assignedAgentId: string): Promise<Ticket[]> {
    return this.ticketsRepository.listByAssignedAgentId(assignedAgentId);
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    await this.findById(id);
    return this.ticketsRepository.updateStatus(id, status);
  }

  async assignAgent(id: string, assignedAgentId: string): Promise<Ticket> {
    await this.findById(id);
    await this.ensureAgent(assignedAgentId);
    return this.ticketsRepository.assignAgent(id, assignedAgentId);
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
