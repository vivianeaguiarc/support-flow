import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForbiddenError, UnauthorizedError } from '../../errors/http-errors.js';
import { PermissionKey } from '../../security/permissions.js';
import { UserRole } from '../../types/user-role.js';
import { requirePermission } from './require-permission.js';

vi.mock(
  '../../../modules/rbac/application/services/permission-resolver.service.js',
  () => ({
    permissionResolverService: {
      resolve: vi.fn(),
    },
  }),
);

vi.mock('../../security/security-audit/security-audit.service.js', () => ({
  securityAuditService: {
    record: vi.fn().mockResolvedValue(undefined),
  },
}));

import { permissionResolverService } from '../../../modules/rbac/application/services/permission-resolver.service.js';

function createRequest(user?: Request['user']): Request {
  return {
    user,
    path: '/test',
    method: 'GET',
    headers: {},
  } as Request;
}

describe('requirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies unauthenticated requests', async () => {
    const next = vi.fn();
    await requirePermission(PermissionKey.USERS_MANAGE)(
      createRequest(),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(new UnauthorizedError());
  });

  it('allows super admin bypass', async () => {
    const next = vi.fn();
    await requirePermission(PermissionKey.USERS_MANAGE)(
      createRequest({
        id: '1',
        email: 'super@test.com',
        role: UserRole.SUPER_ADMIN,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(permissionResolverService.resolve).not.toHaveBeenCalled();
  });

  it('allows when user has required permission', async () => {
    vi.mocked(permissionResolverService.resolve).mockResolvedValue(
      new Set([PermissionKey.USERS_MANAGE]),
    );
    const next = vi.fn();

    await requirePermission(PermissionKey.USERS_MANAGE)(
      createRequest({
        id: '1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('denies when permission is missing', async () => {
    vi.mocked(permissionResolverService.resolve).mockResolvedValue(
      new Set([PermissionKey.TICKETS_READ]),
    );
    const next = vi.fn();

    await requirePermission(PermissionKey.USERS_MANAGE)(
      createRequest({
        id: '1',
        email: 'agent@test.com',
        role: UserRole.AGENT,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(new ForbiddenError());
  });
});
