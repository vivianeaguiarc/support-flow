import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

export type JwtPayload = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Invalid token payload');
  }

  const { id, email, role, tenantId } = decoded as JwtPayload;

  if (!id || !email || !role || !tenantId) {
    throw new Error('Invalid token payload');
  }

  return { id, email, role, tenantId };
}
