import { AppError } from '../../../shared/errors/app-error.js';
import { hashPassword } from '../../../shared/security/password-hash.js';
import { securityAuditService } from '../../../shared/security/security-audit/security-audit.service.js';
import { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../domain/user.entity.js';
import type { ListUsersQueryDto } from '../dtos/list-users-query.dto.js';
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

    const user = await this.repository.create({
      ...data,
      password: hashedPassword,
    });

    if (user.role !== UserRole.CUSTOMER) {
      void securityAuditService.record('USER_PERMISSION_ASSIGNED', {
        tenantId: user.tenantId,
        userId: user.id,
        email: user.email,
        metadata: {
          role: user.role,
        },
      });
    }

    return user;
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

  async list(
    tenantId: string,
    query: ListUsersQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    return this.repository.listWithFilters({
      tenantId,
      search: query.search,
      role: query.role,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

export const usersService = new UsersService();
