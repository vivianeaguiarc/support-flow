import { randomUUID } from 'node:crypto';

import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

export type JwtPayload = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
};

export type RefreshJwtPayload = JwtPayload & {
  jti: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  const refreshPayload: RefreshJwtPayload = {
    ...payload,
    jti: randomUUID(),
  };

  return jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  return parseJwtPayload(decoded);
}

export function verifyRefreshToken(token: string): RefreshJwtPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  const payload = parseJwtPayload(decoded);

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload');
  }

  const { jti } = decoded as RefreshJwtPayload;

  if (!jti) {
    throw new Error('Invalid token payload');
  }

  return { ...payload, jti };
}

export function getRefreshTokenExpiration(refreshToken: string): Date {
  const decoded = jwt.decode(refreshToken);

  if (typeof decoded !== 'object' || decoded === null || !('exp' in decoded)) {
    throw new Error('Invalid refresh token expiration');
  }

  const exp = decoded.exp;

  if (typeof exp !== 'number') {
    throw new Error('Invalid refresh token expiration');
  }

  return new Date(exp * 1000);
}

function parseJwtPayload(decoded: unknown): JwtPayload {
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload');
  }

  const { id, email, role, tenantId } = decoded as JwtPayload;

  if (!id || !email || !role || !tenantId) {
    throw new Error('Invalid token payload');
  }

  return { id, email, role, tenantId };
}
