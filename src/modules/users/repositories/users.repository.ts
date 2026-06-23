import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { prisma } from '../../../shared/database/prisma.js';
import type { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../domain/user.entity.js';

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
    return prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const usersRepository = new UsersRepository();
