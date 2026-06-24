import { describe, expect, it, vi } from 'vitest';

import { PermissionKey } from '../../../../shared/security/permissions.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { PermissionsRepository } from '../../infrastructure/repositories/permissions.repository.js';
import { PermissionResolverService } from './permission-resolver.service.js';

describe('PermissionResolverService', () => {
  it('merges legacy role permissions with assigned role permissions', async () => {
    const repository: PermissionsRepository = {
      list: vi.fn(),
      findByKey: vi.fn(),
      create: vi.fn(),
      findByKeys: vi.fn(),
      resolveKeysForUser: vi
        .fn()
        .mockResolvedValue([PermissionKey.USERS_MANAGE]),
    };

    const service = new PermissionResolverService(repository);
    const permissions = await service.resolve({
      id: 'user-1',
      email: 'agent@test.com',
      role: UserRole.AGENT,
      tenantId: 'tenant-1',
    });

    expect(permissions.has(PermissionKey.TICKETS_READ)).toBe(true);
    expect(permissions.has(PermissionKey.USERS_MANAGE)).toBe(true);
  });
});
