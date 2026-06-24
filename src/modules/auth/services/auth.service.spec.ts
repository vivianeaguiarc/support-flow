import type { RefreshToken } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../../users/domain/user.entity.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import type { LoginSecurityRepository } from '../repositories/login-security.repository.js';
import type { RefreshTokensRepository } from '../repositories/refresh-tokens.repository.js';
import { AuthService } from './auth.service.js';

vi.mock(
  '../../../shared/security/security-audit/security-audit.service.js',
  () => ({
    securityAuditService: {
      record: vi.fn(),
    },
  }),
);

const mockUser: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed-password',
  role: UserRole.CUSTOMER,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const activeRefreshToken: RefreshToken = {
  id: 'refresh-1',
  userId: mockUser.id,
  tenantId: mockUser.tenantId,
  tokenHash: 'hashed-refresh-token',
  expiresAt: new Date('2030-01-01T00:00:00.000Z'),
  revokedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

vi.mock('../../../shared/security/jwt.js', () => ({
  signToken: vi.fn().mockReturnValue('access-token'),
  signRefreshToken: vi.fn().mockReturnValue('refresh-token'),
  verifyRefreshToken: vi.fn().mockReturnValue({
    id: 'user-1',
    email: 'john@example.com',
    role: UserRole.CUSTOMER,
    tenantId: 'tenant-1',
    jti: 'refresh-jti-1',
  }),
  getRefreshTokenExpiration: vi
    .fn()
    .mockReturnValue(new Date('2030-01-01T00:00:00.000Z')),
}));

vi.mock('../../../shared/security/token-hash.js', () => ({
  hashRefreshToken: vi.fn().mockReturnValue('hashed-refresh-token'),
}));

function createUsersRepositoryMock(): UsersRepository {
  return {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
  };
}

function createLoginSecurityRepositoryMock(): LoginSecurityRepository {
  return {
    clearExpiredLock: vi.fn(async (user) => user),
    isAccountLocked: vi.fn(async () => false),
    recordFailedLogin: vi.fn(async () => ({
      locked: false,
      lockedUntil: null,
    })),
    resetAfterSuccessfulLogin: vi.fn(),
  };
}

function createRefreshTokensRepositoryMock(): RefreshTokensRepository {
  return {
    create: vi.fn(),
    findByTokenHash: vi.fn(),
    revoke: vi.fn(),
  };
}

describe('AuthService', () => {
  let usersRepository: UsersRepository;
  let refreshTokensRepository: RefreshTokensRepository;
  let loginSecurityRepository: LoginSecurityRepository;
  let verifyPassword: ReturnType<typeof vi.fn>;
  let service: AuthService;

  beforeEach(() => {
    usersRepository = createUsersRepositoryMock();
    refreshTokensRepository = createRefreshTokensRepositoryMock();
    loginSecurityRepository = createLoginSecurityRepositoryMock();
    verifyPassword = vi.fn();
    service = new AuthService(
      usersRepository,
      refreshTokensRepository,
      loginSecurityRepository,
      verifyPassword as never,
    );
  });

  it('should return the authenticated user via me()', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

    const result = await service.me({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      tenantId: mockUser.tenantId,
    });

    expect(usersRepository.findById).toHaveBeenCalledWith(
      mockUser.id,
      mockUser.tenantId,
    );
    expect(result).toEqual(mockUser);
  });

  it('should throw 404 from me() when user no longer exists', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(
      service.me({
        id: 'missing-user',
        email: 'missing@example.com',
        role: UserRole.AGENT,
        tenantId: 'tenant-1',
      }),
    ).rejects.toEqual(new AppError('User not found', 404));
  });

  it('should scope me() lookup to the effective tenant for super admins', async () => {
    vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);

    await service.me({
      id: mockUser.id,
      email: mockUser.email,
      role: UserRole.SUPER_ADMIN,
      tenantId: 'tenant-1',
      scopedTenantId: 'tenant-override',
    });

    expect(usersRepository.findById).toHaveBeenCalledWith(
      mockUser.id,
      'tenant-override',
    );
  });

  it('should login with valid credentials and issue token pair', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(mockUser);
    verifyPassword.mockResolvedValue(true);
    vi.mocked(refreshTokensRepository.create).mockResolvedValue(
      activeRefreshToken,
    );

    const result = await service.login({
      email: 'john@example.com',
      password: 'plain-password',
    });

    expect(verifyPassword).toHaveBeenCalledWith(
      'plain-password',
      'hashed-password',
    );
    expect(
      loginSecurityRepository.resetAfterSuccessfulLogin,
    ).toHaveBeenCalledWith(mockUser.id);
    expect(refreshTokensRepository.create).toHaveBeenCalledWith({
      userId: mockUser.id,
      tenantId: mockUser.tenantId,
      tokenHash: 'hashed-refresh-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should reject login when user does not exist', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'plain-password',
      }),
    ).rejects.toEqual(new AppError('Invalid credentials', 401));
    expect(verifyPassword).not.toHaveBeenCalled();
    expect(refreshTokensRepository.create).not.toHaveBeenCalled();
  });

  it('should reject login with invalid password', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(mockUser);
    verifyPassword.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'john@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toEqual(new AppError('Invalid credentials', 401));
    expect(refreshTokensRepository.create).not.toHaveBeenCalled();
  });

  it('should reject login when account is locked', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(loginSecurityRepository.isAccountLocked).mockResolvedValue(true);

    await expect(
      service.login({
        email: 'john@example.com',
        password: 'plain-password',
      }),
    ).rejects.toEqual(
      new AppError(
        'Account temporarily locked due to multiple failed login attempts',
        423,
      ),
    );
  });

  it('should lock account after repeated invalid passwords', async () => {
    vi.mocked(usersRepository.findByEmail).mockResolvedValue(mockUser);
    verifyPassword.mockResolvedValue(false);
    vi.mocked(loginSecurityRepository.recordFailedLogin).mockResolvedValue({
      locked: true,
      lockedUntil: new Date('2030-01-01T00:00:00.000Z'),
    });

    await expect(
      service.login({
        email: 'john@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toEqual(
      new AppError(
        'Account temporarily locked due to multiple failed login attempts',
        423,
      ),
    );
  });

  it('should rotate refresh token and issue a new token pair', async () => {
    vi.mocked(refreshTokensRepository.findByTokenHash).mockResolvedValue(
      activeRefreshToken,
    );
    vi.mocked(usersRepository.findById).mockResolvedValue(mockUser);
    vi.mocked(refreshTokensRepository.create).mockResolvedValue({
      ...activeRefreshToken,
      id: 'refresh-2',
    });

    const result = await service.refresh({ refreshToken: 'refresh-token' });

    expect(refreshTokensRepository.revoke).toHaveBeenCalledWith('refresh-1');
    expect(refreshTokensRepository.create).toHaveBeenCalled();
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should reject refresh when token is not found in database', async () => {
    vi.mocked(refreshTokensRepository.findByTokenHash).mockResolvedValue(null);

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toEqual(new AppError('Invalid refresh token', 401));
  });

  it('should reject revoked refresh token', async () => {
    vi.mocked(refreshTokensRepository.findByTokenHash).mockResolvedValue({
      ...activeRefreshToken,
      revokedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toEqual(new AppError('Refresh token has been revoked', 401));
  });

  it('should reject expired refresh token', async () => {
    vi.mocked(refreshTokensRepository.findByTokenHash).mockResolvedValue({
      ...activeRefreshToken,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toEqual(new AppError('Refresh token has expired', 401));
  });

  it('should revoke refresh token on logout', async () => {
    vi.mocked(refreshTokensRepository.findByTokenHash).mockResolvedValue(
      activeRefreshToken,
    );

    const result = await service.logout({ refreshToken: 'refresh-token' });

    expect(refreshTokensRepository.revoke).toHaveBeenCalledWith('refresh-1');
    expect(result).toEqual({ message: 'Logged out successfully' });
  });
});
