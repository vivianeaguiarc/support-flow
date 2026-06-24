import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForbiddenError, UnauthorizedError } from '../../errors/http-errors.js';
import { UserRole } from '../../types/user-role.js';
import { authorize } from './authorize.js';

vi.mock('../../security/security-audit/security-audit.service.js', () => ({
  securityAuditService: {
    record: vi.fn().mockResolvedValue(undefined),
  },
}));

function createMockRequest(user?: Request['user']): Request {
  return {
    user,
    path: '/test',
    method: 'GET',
    headers: {},
  } as Request;
}

describe('authorize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    await middleware(createMockRequest(), {} as Response, next);

    expect(next).toHaveBeenCalledWith(new UnauthorizedError());
  });

  it('should allow admin when ADMIN is in allowed roles', async () => {
    const middleware = authorize(UserRole.ADMIN, UserRole.AGENT);
    const next = vi.fn();

    await middleware(
      createMockRequest({
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

  it('should allow super admin regardless of allowed roles', async () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    await middleware(
      createMockRequest({
        id: '1',
        email: 'super@test.com',
        role: UserRole.SUPER_ADMIN,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('should deny tenant admin when ADMIN is not in allowed roles', async () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    await middleware(
      createMockRequest({
        id: '1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(new ForbiddenError());
  });

  it('should allow users with permitted role', async () => {
    const middleware = authorize(UserRole.AGENT, UserRole.SUPERVISOR);
    const next = vi.fn();

    await middleware(
      createMockRequest({
        id: '1',
        email: 'supervisor@test.com',
        role: UserRole.SUPERVISOR,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('should return 403 for disallowed role', async () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    await middleware(
      createMockRequest({
        id: '1',
        email: 'customer@test.com',
        role: UserRole.CUSTOMER,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(new ForbiddenError());
  });
});
