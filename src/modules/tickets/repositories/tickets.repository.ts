import type { Ticket, TicketStatus } from '@prisma/client';
import { TicketPriority } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';
import type { CreateTicketDomainInput } from '../domain/ticket.types.js';
import type { TicketListFilters } from '../domain/ticket-list-filters.js';
import { resolveTicketListPagination } from '../domain/ticket-list-pagination.js';
import type { PaginatedTicketList } from '../domain/ticket-paginated-list.js';
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
    const result = await this.listWithFilters({ tenantId });
    return result.data;
  }

  async listWithFilters(
    filters: TicketListFilters,
  ): Promise<PaginatedTicketList> {
    const { page, limit } = resolveTicketListPagination(
      filters.page,
      filters.limit,
    );
    const where = buildTicketListWhere(filters);

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit };
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
