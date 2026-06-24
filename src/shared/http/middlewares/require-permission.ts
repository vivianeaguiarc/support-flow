import type { NextFunction, Request, Response } from 'express';

import { permissionResolverService } from '../../../modules/rbac/application/services/permission-resolver.service.js';
import { ForbiddenError, UnauthorizedError } from '../../errors/http-errors.js';
import { getClientIp, getUserAgent } from '../../http/request-client.js';
import {
  hasAnyPermission,
  type PermissionKeyValue,
} from '../../security/permissions.js';
import { isSuperAdmin } from '../../security/rbac.js';
import { securityAuditService } from '../../security/security-audit/security-audit.service.js';

export function requirePermission(
  ...requiredPermissions: PermissionKeyValue[]
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (isSuperAdmin(req.user.role)) {
      next();
      return;
    }

    const userPermissions = await permissionResolverService.resolve(req.user);

    if (hasAnyPermission(userPermissions, requiredPermissions)) {
      next();
      return;
    }

    await securityAuditService.record('ACCESS_DENIED', {
      tenantId: req.user.tenantId,
      actorId: req.user.id,
      email: req.user.email,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      metadata: {
        path: req.path,
        method: req.method,
        requiredPermissions,
      },
    });

    next(new ForbiddenError());
  };
}
