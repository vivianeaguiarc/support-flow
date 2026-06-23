import type { User, UserRole } from '@prisma/client';

import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { prisma } from '../../../shared/database/prisma.js';

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

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async list(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

export const usersRepository = new UsersRepository();
