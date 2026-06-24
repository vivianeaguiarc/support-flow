import type { Request } from 'express';

import { DEFAULT_TENANT_ID } from '../constants/tenant.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

export function resolveTenantId(authUser: AuthenticatedUser): string {
  return authUser.scopedTenantId ?? authUser.tenantId ?? DEFAULT_TENANT_ID;
}

export function getRequestTenantId(
  req: Request,
  authUser?: AuthenticatedUser,
): string {
  if (authUser) {
    return resolveTenantId(authUser);
  }

  return req.tenantId ?? DEFAULT_TENANT_ID;
}
