import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../../errors/http-errors.js';
import { hasAnyRole, isSuperAdmin } from '../../security/rbac.js';
import { UserRole } from '../../types/user-role.js';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (isSuperAdmin(req.user.role)) {
      next();
      return;
    }

    if (
      req.user.role === UserRole.ADMIN &&
      allowedRoles.includes(UserRole.ADMIN)
    ) {
      next();
      return;
    }

    if (!hasAnyRole(req.user.role, allowedRoles)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
