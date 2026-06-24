import { describe, expect, it } from 'vitest';

import { UserRole } from '../../../shared/types/user-role.js';
import type { User } from '../../users/domain/user.entity.js';
import { toAuthUser } from './to-auth-user.js';

const user: User = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed-password',
  role: UserRole.AGENT,
  failedLoginAttempts: 3,
  lockedUntil: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
};

describe('toAuthUser', () => {
  it('exposes only the safe public fields', () => {
    expect(toAuthUser(user)).toEqual({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.AGENT,
      tenantId: 'tenant-1',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('never leaks sensitive or internal fields', () => {
    const result = toAuthUser(user) as Record<string, unknown>;

    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('failedLoginAttempts');
    expect(result).not.toHaveProperty('lockedUntil');
  });
});
