import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { prisma } from '../../../shared/database/prisma.js';
import { resolvePagination } from '../../../shared/http/pagination/pagination.js';
import type { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../domain/user.entity.js';
import type { UserListFilters } from '../domain/user-list-filters.js';
import { buildUserListOrderBy } from './build-user-list-order-by.js';

export type CreateUserInput = {
  tenantId?: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export class UsersRepository {
  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId ?? DEFAULT_TENANT_ID,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      },
    });
  }

  async findByEmail(
    email: string,
    tenantId = DEFAULT_TENANT_ID,
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, tenantId },
    });
  }

  async list(tenantId: string): Promise<User[]> {
    const result = await this.listWithFilters({ tenantId });
    return result.data;
  }

  async listWithFilters(
    filters: UserListFilters,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const { page, limit } = resolvePagination(filters.page, filters.limit);
    const where = {
      tenantId: filters.tenantId,
      ...(filters.role ? { role: filters.role } : {}),
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

    const orderBy = buildUserListOrderBy(filters.sortBy, filters.sortOrder);

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

export const usersRepository = new UsersRepository();
