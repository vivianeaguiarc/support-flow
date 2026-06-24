import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionKey } from '../../../../shared/security/permissions.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { PermissionsRepository } from '../../infrastructure/repositories/permissions.repository.js';
import type { RolesRepository } from '../../infrastructure/repositories/roles.repository.js';
import { RolesAdminService } from './roles-admin.service.js';

vi.mock(
  '../../../../shared/security/security-audit/security-audit.service.js',
  () => ({
    securityAuditService: {
      record: vi.fn(),
    },
  }),
);

describe('RolesAdminService', () => {
  const rolesRepository: RolesRepository = {
    listByTenant: vi.fn(),
    findByIdAndTenant: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    replacePermissions: vi.fn(),
  };

  const permissionsRepository: PermissionsRepository = {
    list: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    findByKeys: vi.fn(),
    resolveKeysForUser: vi.fn(),
  };

  let service: RolesAdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RolesAdminService(rolesRepository, permissionsRepository);
  });

  it('assigns permissions to a role', async () => {
    vi.mocked(rolesRepository.findByIdAndTenant)
      .mockResolvedValueOnce({
        id: 'role-1',
        tenantId: 'tenant-1',
        name: 'Custom',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
      })
      .mockResolvedValueOnce({
        id: 'role-1',
        tenantId: 'tenant-1',
        name: 'Custom',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
          {
            id: 'rp-1',
            roleId: 'role-1',
            permissionId: 'perm-1',
            createdAt: new Date(),
            permission: {
              id: 'perm-1',
              key: PermissionKey.TICKETS_READ,
              description: 'Read',
              createdAt: new Date(),
            },
          },
        ],
      });

    vi.mocked(permissionsRepository.findByKeys).mockResolvedValue([
      {
        id: 'perm-1',
        key: PermissionKey.TICKETS_READ,
        description: 'Read',
        createdAt: new Date(),
      },
    ]);

    const result = await service.assignPermissions(
      {
        id: 'admin-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        tenantId: 'tenant-1',
      },
      'role-1',
      { permissionKeys: [PermissionKey.TICKETS_READ] },
    );

    expect(rolesRepository.replacePermissions).toHaveBeenCalledWith('role-1', [
      'perm-1',
    ]);
    expect(result?.permissions).toHaveLength(1);
  });
});
