import { UserRole } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';
import { hasAnyRole, isAdmin } from '../../security/rbac.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    if (isAdmin(req.user.role)) {
      next();
      return;
    }

    if (!hasAnyRole(req.user.role, allowedRoles)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
}
