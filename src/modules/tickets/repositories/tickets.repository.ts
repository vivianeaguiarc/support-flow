import type { Ticket, TicketStatus } from '@prisma/client';
import { TicketPriority } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';
import type { CreateTicketDomainInput } from '../domain/ticket.types.js';
import type { TicketListFilters } from '../domain/ticket-list-filters.js';
import { buildTicketListWhere } from './build-ticket-list-where.js';

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

  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<Ticket | null> {
    return prisma.ticket.findFirst({
      where: { id, tenantId },
    });
  }

  async listByTenant(tenantId: string): Promise<Ticket[]> {
    return this.listWithFilters({ tenantId });
  }

  async listWithFilters(filters: TicketListFilters): Promise<Ticket[]> {
    const page = filters.page ?? 1;
    const limit = filters.limit;

    return prisma.ticket.findMany({
      where: buildTicketListWhere(filters),
      orderBy: { createdAt: 'desc' },
      ...(limit
        ? {
            take: limit,
            skip: (page - 1) * limit,
          }
        : {}),
    });
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
