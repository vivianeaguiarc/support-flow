import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import { AuthService } from './auth.service.js';

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

describe('AuthService', () => {
  let repository: UsersRepository;
  let verifyPassword: ReturnType<typeof vi.fn>;
  let generateToken: ReturnType<typeof vi.fn>;
  let service: AuthService;

  beforeEach(() => {
    repository = createUsersRepositoryMock();
    verifyPassword = vi.fn();
    generateToken = vi.fn().mockReturnValue('jwt-token');
    service = new AuthService(
      repository,
      generateToken,
      verifyPassword as never,
    );
  });

  it('should login with valid credentials', async () => {
    // Arrange
    vi.mocked(repository.findByEmail).mockResolvedValue(mockUser);
    verifyPassword.mockResolvedValue(true);

    // Act
    const result = await service.login({
      email: 'john@example.com',
      password: 'plain-password',
    });

    // Assert
    expect(verifyPassword).toHaveBeenCalledWith(
      'plain-password',
      'hashed-password',
    );
    expect(generateToken).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({ token: 'jwt-token' });
  });

  it('should reject login when user does not exist', async () => {
    // Arrange
    vi.mocked(repository.findByEmail).mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'plain-password',
      }),
    ).rejects.toEqual(new AppError('Invalid credentials', 401));
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it('should reject login with invalid password', async () => {
    // Arrange
    vi.mocked(repository.findByEmail).mockResolvedValue(mockUser);
    verifyPassword.mockResolvedValue(false);

    // Act & Assert
    await expect(
      service.login({
        email: 'john@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toEqual(new AppError('Invalid credentials', 401));
    expect(generateToken).not.toHaveBeenCalled();
  });
});
