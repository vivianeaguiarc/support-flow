import type { TicketCategory } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import { resolvePagination } from '../../../../shared/http/pagination/pagination.js';
import type { TicketCategoryListFilters } from '../../domain/ticket-category-list-filters.js';
import { buildTicketCategoryListOrderBy } from './build-ticket-category-list-order-by.js';

export class TicketCategoriesRepository {
  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TicketCategory | null> {
    return prisma.ticketCategory.findFirst({
      where: { id, tenantId },
    });
  }

  async listWithFilters(filters: TicketCategoryListFilters): Promise<{
    data: TicketCategory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit } = resolvePagination(filters.page, filters.limit);
    const where = {
      tenantId: filters.tenantId,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search
        ? {
            OR: [
              {
                name: {
                  contains: filters.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                description: {
                  contains: filters.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(filters.createdFrom || filters.createdTo
        ? {
            createdAt: {
              ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
              ...(filters.createdTo ? { lte: filters.createdTo } : {}),
            },
          }
        : {}),
    };

    const orderBy = buildTicketCategoryListOrderBy(
      filters.sortBy,
      filters.sortOrder,
    );

    const [data, total] = await Promise.all([
      prisma.ticketCategory.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.ticketCategory.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export const ticketCategoriesRepository = new TicketCategoriesRepository();
