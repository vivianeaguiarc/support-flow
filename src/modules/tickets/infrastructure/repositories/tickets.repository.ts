import type { Ticket, TicketStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { TicketPriority } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import { resolvePagination } from '../../../../shared/http/pagination/pagination.js';
import type { CreateTicketDomainInput } from '../../domain/ticket.types.js';
import type { TicketListFilters } from '../../domain/ticket-list-filters.js';
import { resolveTicketListPagination } from '../../domain/ticket-list-pagination.js';
import type { PaginatedTicketList } from '../../domain/ticket-paginated-list.js';
import { SLA_ACTIVE_TICKET_STATUSES } from '../../domain/ticket-sla-status.js';
import { buildTicketListOrderBy } from './build-ticket-list-order-by.js';
import { buildTicketListWhere } from './build-ticket-list-where.js';

export type CreateTicketInput = CreateTicketDomainInput & {
  status?: TicketStatus;
};

export class TicketsRepository {
  async create(
    data: CreateTicketInput,
    tx?: Prisma.TransactionClient,
  ): Promise<Ticket> {
    const client = tx ?? prisma;
    return client.ticket.create({
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
    const orderBy = buildTicketListOrderBy(filters.sortBy, filters.sortOrder);

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
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

  async updateStatus(
    id: string,
    status: TicketStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Ticket> {
    const client = tx ?? prisma;
    return client.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === 'CLOSED' ? new Date() : null,
      },
    });
  }

  async updatePriority(id: string, priority: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { priority: priority as TicketPriority },
    });
  }

  async assignTo(
    id: string,
    assignedToId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Ticket> {
    const client = tx ?? prisma;
    return client.ticket.update({
      where: { id },
      data: { assignedToId },
    });
  }

  async findAll(filters: {
    status?: TicketStatus[];
    hasSla?: boolean;
  }): Promise<Ticket[]> {
    const where: {
      status?: { in: TicketStatus[] };
      slaDueAt?: { not: null };
    } = {};

    if (filters.status) {
      where.status = { in: filters.status };
    }

    if (filters.hasSla) {
      where.slaDueAt = { not: null };
    }

    return prisma.ticket.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async countActiveTicketsByAgent(
    agentId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.ticket.count({
      where: {
        tenantId,
        assignedToId: agentId,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED'],
        },
      },
    });
  }

  async findUnassignedOpenTickets(tenantId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: {
        tenantId,
        assignedToId: null,
        status: 'OPEN',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findActiveWithSlaByTenant(tenantId: string): Promise<Ticket[]> {
    return prisma.ticket.findMany({
      where: {
        tenantId,
        slaDueAt: { not: null },
        status: { in: [...SLA_ACTIVE_TICKET_STATUSES] },
      },
    });
  }

  async listBreachedSlaByTenant(input: {
    tenantId: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Ticket[]; total: number; page: number; limit: number }> {
    const { page, limit } = resolvePagination(input.page, input.limit);
    const where = {
      tenantId: input.tenantId,
      slaDueAt: { lt: new Date() },
      status: { in: [...SLA_ACTIVE_TICKET_STATUSES] },
    };

    const [data, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { slaDueAt: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export const ticketsRepository = new TicketsRepository();
