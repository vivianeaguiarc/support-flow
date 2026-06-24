import type { PrismaClient } from '@prisma/client';

import {
  DEFAULT_ROLE_DEFINITIONS,
  INITIAL_PERMISSIONS,
  type PermissionKeyValue,
} from '../../src/shared/security/permissions.js';
import { UserRole } from '../../src/shared/types/user-role.js';

export async function seedPermissionCatalog(
  prisma: PrismaClient,
): Promise<Map<PermissionKeyValue, string>> {
  const permissionIdByKey = new Map<PermissionKeyValue, string>();

  for (const permission of INITIAL_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      create: {
        key: permission.key,
        description: permission.description,
      },
      update: {
        description: permission.description,
      },
    });
    permissionIdByKey.set(permission.key, record.id);
  }

  return permissionIdByKey;
}

export async function seedTenantRoles(
  prisma: PrismaClient,
  tenantId: string,
  permissionIdByKey: Map<PermissionKeyValue, string>,
): Promise<Map<UserRole, string>> {
  const roleIdByLegacy = new Map<UserRole, string>();

  for (const definition of DEFAULT_ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: definition.name,
        },
      },
      create: {
        tenantId,
        name: definition.name,
        description: definition.description,
      },
      update: {
        description: definition.description,
      },
    });

    roleIdByLegacy.set(definition.legacyRole, role.id);

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    for (const permissionKey of definition.permissions) {
      const permissionId = permissionIdByKey.get(permissionKey);
      if (!permissionId) {
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }

  return roleIdByLegacy;
}

export async function assignUserLegacyRole(
  prisma: PrismaClient,
  input: {
    userId: string;
    tenantId: string;
    legacyRole: UserRole;
    roleIdByLegacy: Map<UserRole, string>;
  },
): Promise<void> {
  const roleId = input.roleIdByLegacy.get(input.legacyRole);
  if (!roleId) {
    return;
  }

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: input.userId,
        roleId,
      },
    },
    create: {
      userId: input.userId,
      roleId,
      tenantId: input.tenantId,
    },
    update: {
      tenantId: input.tenantId,
    },
  });
}

export async function seedRbacForTenant(
  prisma: PrismaClient,
  tenantId: string,
): Promise<Map<UserRole, string>> {
  const permissionIdByKey = await seedPermissionCatalog(prisma);
  return seedTenantRoles(prisma, tenantId, permissionIdByKey);
}
