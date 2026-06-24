import type { NextFunction, Request, Response } from 'express';

import {
  TenantsRepository,
  tenantsRepository,
} from '../../../modules/tickets/infrastructure/repositories/tenants.repository.js';
import { ForbiddenError, NotFoundError } from '../../errors/http-errors.js';
import { toOrganization } from '../../tenant/organization.entity.js';
import { resolveTenantHintFromRequest } from '../../tenant/resolve-tenant.js';
import { UserRole } from '../../types/user-role.js';

export async function resolveTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const hint = resolveTenantHintFromRequest(req);
    if (!hint.tenantId && !hint.tenantSlug) {
      next();
      return;
    }

    const tenant = await tenantsRepository.resolveFromHint(hint);
    if (!tenant) {
      next(new NotFoundError('Tenant not found'));
      return;
    }

    req.tenantId = tenant.id;
    req.organization = toOrganization(tenant);
    next();
  } catch (error) {
    next(error);
  }
}

export function applyTenantScopeToRequest(req: Request): void {
  if (!req.user) {
    return;
  }

  const requestedTenantId = req.tenantId;
  const { user } = req;

  if (user.role === UserRole.SUPER_ADMIN) {
    const scopedTenantId = requestedTenantId ?? user.tenantId;
    req.user = { ...user, scopedTenantId };
    req.tenantId = scopedTenantId;
    return;
  }

  if (requestedTenantId && requestedTenantId !== user.tenantId) {
    throw new ForbiddenError('Cross-tenant access denied');
  }

  req.user = { ...user, scopedTenantId: user.tenantId };
  req.tenantId = user.tenantId;
}

export function createTenantScopeMiddleware(
  repository: TenantsRepository = tenantsRepository,
) {
  return async function tenantScopeMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const hint = resolveTenantHintFromRequest(req);
      if (hint.tenantId || hint.tenantSlug) {
        const tenant = await repository.resolveFromHint(hint);
        if (!tenant) {
          next(new NotFoundError('Tenant not found'));
          return;
        }
        req.tenantId = tenant.id;
        req.organization = toOrganization(tenant);
      }

      applyTenantScopeToRequest(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const enforceTenantScope = createTenantScopeMiddleware();
