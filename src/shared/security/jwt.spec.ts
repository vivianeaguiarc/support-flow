import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const payload = {
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.AGENT,
  tenantId: 'tenant-1',
};

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'access-secret',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

describe('jwt', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should sign and verify access tokens', async () => {
    const { signToken, verifyToken } = await import('./jwt.js');

    const token = signToken(payload);

    expect(verifyToken(token)).toEqual(payload);
  });

  it('should sign and verify refresh tokens', async () => {
    const { signRefreshToken, verifyRefreshToken, getRefreshTokenExpiration } =
      await import('./jwt.js');

    const token = signRefreshToken(payload);

    expect(verifyRefreshToken(token)).toMatchObject(payload);
    expect(verifyRefreshToken(token).jti).toEqual(expect.any(String));
    expect(getRefreshTokenExpiration(token).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('should reject refresh tokens signed with the access secret', async () => {
    const { verifyRefreshToken } = await import('./jwt.js');
    const wrongToken = jwt.sign(payload, 'access-secret', { expiresIn: '7d' });

    expect(() => verifyRefreshToken(wrongToken)).toThrow();
  });
});
