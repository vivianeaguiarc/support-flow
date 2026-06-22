import type { User, UserRole } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export class UsersRepository {
  async create(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async list(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }
}

export const usersRepository = new UsersRepository();
