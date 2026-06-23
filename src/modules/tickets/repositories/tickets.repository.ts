import type { Ticket, TicketStatus } from '@prisma/client';
import { TicketPriority } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';
import type { CreateTicketDomainInput } from '../domain/ticket.types.js';

export type CreateTicketInput = CreateTicketDomainInput & {
  status?: TicketStatus;
};

export class TicketsRepository {
  async create(data: CreateTicketInput): Promise<Ticket> {
    return prisma.ticket.create({
      data: {
        tenantId: data.tenantId,
        protocol: data.protocol,
        title: data.title,
        description: data.description,
        customerId: data.customerId,
        priority: data.priority ?? TicketPriority.MEDIUM,
        status: data.status,
        categoryId: data.categoryId,
        assignedToId: data.assignedToId,
        slaDueAt: data.slaDueAt,
      },
    });
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

  async listByAssignedToId(assignedToId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: { assignedToId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null,
      },
    });
  }

  async assignTo(id: string, assignedToId: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { assignedToId },
    });
  }
}

export const ticketsRepository = new TicketsRepository();
