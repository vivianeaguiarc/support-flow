import type { RefreshToken } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export type CreateRefreshTokenInput = {
  userId: string;
  tenantId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class RefreshTokensRepository {
  async create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revoke(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}

export const refreshTokensRepository = new RefreshTokensRepository();
