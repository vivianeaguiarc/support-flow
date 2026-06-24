import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../../security/jwt.js';
import { applyTenantScopeToRequest } from './tenant-scope.middleware.js';

export function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    next();
    return;
  }

  try {
    req.user = verifyToken(token);
    applyTenantScopeToRequest(req);
  } catch {
    // Ignore invalid tokens for optional authentication.
  }

  next();
}
