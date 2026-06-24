import { AppError } from '../../../shared/errors/app-error.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../shared/logger/business-logger.js';
import {
  getRefreshTokenExpiration,
  signRefreshToken,
  signToken,
  verifyRefreshToken,
} from '../../../shared/security/jwt.js';
import { comparePassword } from '../../../shared/security/password-hash.js';
import { securityAuditService } from '../../../shared/security/security-audit/security-audit.service.js';
import { hashRefreshToken } from '../../../shared/security/token-hash.js';
import { resolveTenantId } from '../../../shared/tenant/get-request-tenant-id.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import type { User } from '../../users/domain/user.entity.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import {
  LoginSecurityRepository,
  loginSecurityRepository as defaultLoginSecurityRepository,
} from '../repositories/login-security.repository.js';
import type { RefreshTokensRepository } from '../repositories/refresh-tokens.repository.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginContext = {
  ipAddress?: string;
  userAgent?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type LoginResult = TokenPair;

export type RefreshInput = {
  refreshToken: string;
};

export type LogoutInput = {
  refreshToken: string;
};

type VerifyPasswordFn = typeof comparePassword;

export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly loginSecurityRepository: LoginSecurityRepository = defaultLoginSecurityRepository,
    private readonly verifyPassword: VerifyPasswordFn = comparePassword,
  ) {}

  async me(authUser: AuthenticatedUser): Promise<User> {
    const user = await this.usersRepository.findById(
      authUser.id,
      resolveTenantId(authUser),
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async login(
    data: LoginInput,
    context: LoginContext = {},
  ): Promise<LoginResult> {
    const user = await this.usersRepository.findByEmail(data.email);

    if (!user) {
      this.auditLoginFailed(data.email, context);
      throw new AppError('Invalid credentials', 401);
    }

    const unlockedUser =
      await this.loginSecurityRepository.clearExpiredLock(user);

    if (await this.loginSecurityRepository.isAccountLocked(unlockedUser)) {
      await securityAuditService.record('LOGIN_LOCKED', {
        tenantId: unlockedUser.tenantId,
        userId: unlockedUser.id,
        email: unlockedUser.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      throw new AppError(
        'Account temporarily locked due to multiple failed login attempts',
        423,
      );
    }

    const isPasswordValid = await this.verifyPassword(
      data.password,
      unlockedUser.password,
    );

    if (!isPasswordValid) {
      const lockState =
        await this.loginSecurityRepository.recordFailedLogin(unlockedUser);

      this.auditLoginFailed(unlockedUser.email, context, {
        tenantId: unlockedUser.tenantId,
        userId: unlockedUser.id,
        locked: lockState.locked,
      });

      if (lockState.locked) {
        await securityAuditService.record('LOGIN_LOCKED', {
          tenantId: unlockedUser.tenantId,
          userId: unlockedUser.id,
          email: unlockedUser.email,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            lockedUntil: lockState.lockedUntil?.toISOString(),
          },
        });
        throw new AppError(
          'Account temporarily locked due to multiple failed login attempts',
          423,
        );
      }

      throw new AppError('Invalid credentials', 401);
    }

    await this.loginSecurityRepository.resetAfterSuccessfulLogin(
      unlockedUser.id,
    );

    return this.issueTokenPair(unlockedUser);
  }

  async refresh(data: RefreshInput): Promise<TokenPair> {
    const payload = this.parseRefreshToken(data.refreshToken);
    const tokenHash = hashRefreshToken(data.refreshToken);
    const storedToken =
      await this.refreshTokensRepository.findByTokenHash(tokenHash);

    this.assertRefreshTokenIsUsable(storedToken, payload);

    await this.refreshTokensRepository.revoke(storedToken!.id);

    const user = await this.usersRepository.findById(
      payload.id,
      payload.tenantId,
    );

    if (!user) {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'user_not_found',
      });
      throw new AppError('Invalid refresh token', 401);
    }

    return this.issueTokenPair(user);
  }

  async logout(data: LogoutInput): Promise<{ message: string }> {
    const payload = this.parseRefreshToken(data.refreshToken);
    const tokenHash = hashRefreshToken(data.refreshToken);
    const storedToken =
      await this.refreshTokensRepository.findByTokenHash(tokenHash);

    this.assertRefreshTokenIsUsable(storedToken, payload);

    await this.refreshTokensRepository.revoke(storedToken!.id);

    return { message: 'Logged out successfully' };
  }

  private auditLoginFailed(
    email: string,
    context: LoginContext,
    extra: {
      tenantId?: string;
      userId?: string;
      locked?: boolean;
    } = {},
  ): void {
    logBusinessEvent(BusinessEvent.AUTH_LOGIN_FAILED, {
      reason: 'invalid_credentials',
      locked: extra.locked ?? false,
    });

    void securityAuditService.record('LOGIN_FAILED', {
      tenantId: extra.tenantId,
      userId: extra.userId,
      email,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        locked: extra.locked ?? false,
      },
    });
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const accessToken = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const refreshToken = signRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    await this.refreshTokensRepository.create({
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiration(refreshToken),
    });

    return { accessToken, refreshToken };
  }

  private parseRefreshToken(refreshToken: string) {
    try {
      return verifyRefreshToken(refreshToken);
    } catch {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'invalid_token',
      });
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private assertRefreshTokenIsUsable(
    storedToken: {
      id: string;
      userId: string;
      tenantId: string;
      expiresAt: Date;
      revokedAt: Date | null;
    } | null,
    payload: { id: string; tenantId: string },
  ): void {
    if (!storedToken) {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'token_not_found',
      });
      throw new AppError('Invalid refresh token', 401);
    }

    if (storedToken.revokedAt) {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'token_revoked',
      });
      throw new AppError('Refresh token has been revoked', 401);
    }

    if (storedToken.expiresAt.getTime() <= Date.now()) {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'token_expired',
      });
      throw new AppError('Refresh token has expired', 401);
    }

    if (
      storedToken.userId !== payload.id ||
      storedToken.tenantId !== payload.tenantId
    ) {
      logBusinessEvent(BusinessEvent.AUTH_REFRESH_FAILED, {
        reason: 'token_mismatch',
      });
      throw new AppError('Invalid refresh token', 401);
    }
  }
}
