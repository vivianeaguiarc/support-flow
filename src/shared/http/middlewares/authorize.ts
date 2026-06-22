import { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
}
