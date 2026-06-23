import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../../errors/app-error.js';
import { authorize } from './authorize.js';

function createMockRequest(user?: Request['user']): Request {
  return { user } as Request;
}

describe('authorize', () => {
  it('should return 401 when user is not authenticated', () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    middleware(createMockRequest(), {} as Response, next);

    expect(next).toHaveBeenCalledWith(new AppError('Unauthorized', 401));
  });

  it('should allow admin regardless of allowed roles', () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    middleware(
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

  it('should allow users with permitted role', () => {
    const middleware = authorize(UserRole.AGENT, UserRole.SUPERVISOR);
    const next = vi.fn();

    middleware(
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

  it('should return 403 for disallowed role', () => {
    const middleware = authorize(UserRole.AGENT);
    const next = vi.fn();

    middleware(
      createMockRequest({
        id: '1',
        email: 'customer@test.com',
        role: UserRole.CUSTOMER,
        tenantId: 'tenant-1',
      }),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(new AppError('Forbidden', 403));
  });
});
