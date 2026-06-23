import type { User } from '@prisma/client';

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
import { hashRefreshToken } from '../../../shared/security/token-hash.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import type { RefreshTokensRepository } from '../repositories/refresh-tokens.repository.js';

export type LoginInput = {
  email: string;
  password: string;
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
    private readonly verifyPassword: VerifyPasswordFn = comparePassword,
  ) {}

  async login(data: LoginInput): Promise<LoginResult> {
    const user = await this.usersRepository.findByEmail(data.email);

    if (!user) {
      logBusinessEvent(BusinessEvent.AUTH_LOGIN_FAILED, {
        reason: 'invalid_credentials',
      });
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await this.verifyPassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      logBusinessEvent(BusinessEvent.AUTH_LOGIN_FAILED, {
        reason: 'invalid_credentials',
      });
      throw new AppError('Invalid credentials', 401);
    }

    return this.issueTokenPair(user);
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
