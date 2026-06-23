import type { Request } from 'express';

import { AppError } from '../../errors/app-error.js';
import type { AuthenticatedUser } from '../../types/authenticated-user.js';

export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  return req.user;
}
