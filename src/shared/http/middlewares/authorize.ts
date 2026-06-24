import type { NextFunction, Request, Response } from 'express';

import { ForbiddenError, UnauthorizedError } from '../../errors/http-errors.js';
import { getClientIp, getUserAgent } from '../../http/request-client.js';
import { hasAnyRole, isSuperAdmin } from '../../security/rbac.js';
import { securityAuditService } from '../../security/security-audit/security-audit.service.js';
import { UserRole } from '../../types/user-role.js';

export function authorize(...allowedRoles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
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
      await securityAuditService.record('ACCESS_DENIED', {
        tenantId: req.user.tenantId,
        actorId: req.user.id,
        email: req.user.email,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        metadata: {
          path: req.path,
          method: req.method,
          requiredRoles: allowedRoles,
          role: req.user.role,
        },
      });
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
