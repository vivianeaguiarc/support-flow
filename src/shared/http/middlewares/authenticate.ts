import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../errors/http-errors.js';
import { verifyToken } from '../../security/jwt.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token not provided'));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    next(new UnauthorizedError('Token not provided'));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
