import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/users.repository.js', () => ({
  UsersRepository: vi.fn(),
  usersRepository: {},
}));

vi.mock('../../../shared/security/password-hash.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

import { AppError } from '../../../shared/errors/app-error.js';
import { hashPassword } from '../../../shared/security/password-hash.js';
import type { UsersRepository } from '../repositories/users.repository.js';
import { UsersService } from './users.service.js';

const mockUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed-password',
  role: UserRole.CUSTOMER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createUsersRepositoryMock(): UsersRepository {
  return {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
  };
}

describe('UsersService', () => {
  let repository: UsersRepository;
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = createUsersRepositoryMock();
    service = new UsersService(repository);
    vi.mocked(hashPassword).mockResolvedValue('hashed-password');
  });

  it('should create a user', async () => {
    // Arrange
    vi.mocked(repository.findByEmail).mockResolvedValue(null);
    vi.mocked(repository.create).mockResolvedValue(mockUser);

    // Act
    const result = await service.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'plain-password',
      role: UserRole.CUSTOMER,
    });

    // Assert
    expect(hashPassword).toHaveBeenCalledWith('plain-password');
    expect(repository.create).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      role: UserRole.CUSTOMER,
    });
    expect(result).toEqual(mockUser);
  });

  it('should prevent duplicate email registration', async () => {
    // Arrange
    vi.mocked(repository.findByEmail).mockResolvedValue(mockUser);

    // Act & Assert
    await expect(
      service.create({
        name: 'Another User',
        email: 'john@example.com',
        password: 'plain-password',
        role: UserRole.CUSTOMER,
      }),
    ).rejects.toEqual(new AppError('Email already in use', 409));
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should throw when user is not found by id', async () => {
    // Arrange
    vi.mocked(repository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(service.findById('missing-id', 'tenant-1')).rejects.toEqual(
      new AppError('User not found', 404),
    );
  });
});
