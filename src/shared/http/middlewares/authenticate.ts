import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../logger/business-logger.js';
import { verifyToken } from '../../security/jwt.js';

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
      reason: 'token_not_provided',
    });
    next(new UnauthorizedError('Token not provided'));
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token) {
    logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
      reason: 'token_not_provided',
    });
    next(new UnauthorizedError('Token not provided'));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
      reason: 'invalid_or_expired_token',
    });
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
