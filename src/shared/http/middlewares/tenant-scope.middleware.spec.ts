import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '../../errors/http-errors.js';
import { UserRole } from '../../types/user-role.js';
import { applyTenantScopeToRequest } from './tenant-scope.middleware.js';

describe('applyTenantScopeToRequest', () => {
  it('scopes regular users to their own tenant', () => {
    const req = {
      user: {
        id: 'user-1',
        email: 'agent@test.com',
        role: UserRole.AGENT,
        tenantId: 'tenant-a',
      },
      tenantId: 'tenant-b',
    } as never;

    expect(() => applyTenantScopeToRequest(req)).toThrow(ForbiddenError);
  });

  it('allows super admin to override tenant via request context', () => {
    const req = {
      user: {
        id: 'super-1',
        email: 'super@test.com',
        role: UserRole.SUPER_ADMIN,
        tenantId: 'tenant-a',
      },
      tenantId: 'tenant-b',
    } as never;

    applyTenantScopeToRequest(req);

    expect(req.user?.scopedTenantId).toBe('tenant-b');
    expect(req.tenantId).toBe('tenant-b');
  });
});
