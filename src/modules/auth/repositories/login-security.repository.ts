import { env } from '../../../config/env.js';
import { prisma } from '../../../shared/database/prisma.js';
import type { User } from '../../users/domain/user.entity.js';

export type LoginSecurityState = {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

export class LoginSecurityRepository {
  async clearExpiredLock(user: User): Promise<User> {
    if (!user.lockedUntil || user.lockedUntil.getTime() > Date.now()) {
      return user;
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async isAccountLocked(user: User): Promise<boolean> {
    const current = await this.clearExpiredLock(user);
    return (
      current.lockedUntil !== null && current.lockedUntil.getTime() > Date.now()
    );
  }

  async recordFailedLogin(user: User): Promise<{
    locked: boolean;
    lockedUntil: Date | null;
  }> {
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= env.LOGIN_MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + env.LOGIN_LOCK_DURATION_MS)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil,
      },
    });

    return {
      locked: shouldLock,
      lockedUntil,
    };
  }

  async resetAfterSuccessfulLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}

export const loginSecurityRepository = new LoginSecurityRepository();
