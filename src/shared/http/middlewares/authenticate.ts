import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';
import { verifyToken } from '../../security/jwt.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Token not provided', 401));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    next(new AppError('Token not provided', 401));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
