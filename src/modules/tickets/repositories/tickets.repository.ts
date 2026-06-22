import type { Ticket, TicketPriority, TicketStatus } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export type CreateTicketInput = {
  title: string;
  description: string;
  customerId: string;
  priority?: TicketPriority;
  status?: TicketStatus;
};

export class TicketsRepository {
  async create(data: CreateTicketInput): Promise<Ticket> {
    return prisma.ticket.create({ data });
  }

  async findById(id: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({ where: { id } });
  }

  async list(): Promise<Ticket[]> {
    return prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async listByCustomerId(customerId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listByAssignedAgentId(assignedAgentId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { assignedAgentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }

  async assignAgent(id: string, assignedAgentId: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { assignedAgentId },
    });
  }
}

export const ticketsRepository = new TicketsRepository();
