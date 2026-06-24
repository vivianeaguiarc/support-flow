import { AppError } from '../errors/app-error.js';
import { ForbiddenError } from '../errors/http-errors.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';
import { isSuperAdmin } from './rbac.js';

export type TenantScopedResource = {
  tenantId: string;
};

export function assertTenantResource<T extends TenantScopedResource>(
  resource: T | null,
  tenantId: string,
  notFoundMessage = 'Resource not found',
): T {
  if (!resource) {
    throw new AppError(notFoundMessage, 404);
  }

  if (resource.tenantId !== tenantId) {
    throw new AppError('Forbidden', 403);
  }

  return resource;
}

export function assertTicketForTenant<T extends TenantScopedResource>(
  ticket: T | null,
  tenantId: string,
): T {
  return assertTenantResource(ticket, tenantId, 'Ticket not found');
}

export function assertCrossTenantAccess(
  authUser: AuthenticatedUser,
  targetTenantId: string,
): void {
  if (isSuperAdmin(authUser.role)) {
    return;
  }

  if (authUser.tenantId !== targetTenantId) {
    throw new ForbiddenError('Cross-tenant access denied');
  }
}

export function assertRelatedEntityTenant(
  entityTenantId: string,
  expectedTenantId: string,
  message = 'Invalid tenant for related resource',
): void {
  if (entityTenantId !== expectedTenantId) {
    throw new AppError(message, 403);
  }
}
