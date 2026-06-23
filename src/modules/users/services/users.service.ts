import { AppError } from '../../../shared/errors/app-error.js';
import { hashPassword } from '../../../shared/security/password-hash.js';
import type { User } from '../domain/user.entity.js';
import {
  type CreateUserInput,
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../repositories/users.repository.js';

export class UsersService {
  constructor(
    private readonly repository: UsersRepository = defaultUsersRepository,
  ) {}

  async create(data: CreateUserInput): Promise<User> {
    const existingUser = await this.repository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    return this.repository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async findById(id: string, tenantId: string): Promise<User> {
    const user = await this.repository.findById(id, tenantId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async list(tenantId: string): Promise<User[]> {
    return this.repository.list(tenantId);
  }
}

export const usersService = new UsersService();
