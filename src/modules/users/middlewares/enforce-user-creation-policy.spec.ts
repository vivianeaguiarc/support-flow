import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../shared/errors/app-error.js';
import { UserRole } from '../../../shared/types/user-role.js';
import { enforceUserCreationPolicy } from './enforce-user-creation-policy.js';

function createMockResponse(): Response {
  return {} as Response;
}

describe('enforceUserCreationPolicy', () => {
  it('allows public registration for CUSTOMER role', () => {
    const req = {
      body: { role: UserRole.CUSTOMER },
    } as Request;
    const next = vi.fn();

    enforceUserCreationPolicy(req, createMockResponse(), next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('blocks ADMIN creation without authenticated admin', () => {
    const req = {
      body: { role: UserRole.ADMIN },
    } as Request;
    const next = vi.fn();

    enforceUserCreationPolicy(req, createMockResponse(), next as NextFunction);

    expect(next).toHaveBeenCalledWith(
      new AppError(
        'Only administrators can create users with staff roles',
        403,
      ),
    );
  });

  it('allows ADMIN creation when requester is admin', () => {
    const req = {
      body: { role: UserRole.AGENT },
      user: { role: UserRole.ADMIN },
    } as Request;
    const next = vi.fn();

    enforceUserCreationPolicy(req, createMockResponse(), next as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });
});
