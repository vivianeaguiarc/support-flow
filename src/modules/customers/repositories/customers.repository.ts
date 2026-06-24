import type { Customer } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';
import { resolvePagination } from '../../../shared/http/pagination/pagination.js';
import type { CustomerListFilters } from '../domain/customer-list-filters.js';
import { buildCustomerListOrderBy } from './build-customer-list-order-by.js';

export type CreateCustomerInput = {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
};

export class CustomersRepository {
  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    return prisma.customer.create({ data });
  }

  async listWithFilters(
    filters: CustomerListFilters,
  ): Promise<{ data: Customer[]; total: number; page: number; limit: number }> {
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
                email: {
                  contains: filters.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                phone: {
                  contains: filters.search.trim(),
                  mode: 'insensitive' as const,
                },
              },
              {
                document: {
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

    const orderBy = buildCustomerListOrderBy(filters.sortBy, filters.sortOrder);

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export const customersRepository = new CustomersRepository();
