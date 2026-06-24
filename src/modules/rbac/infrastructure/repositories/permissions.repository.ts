import { prisma } from '../../../../shared/database/prisma.js';
import type { PermissionKeyValue } from '../../../../shared/security/permissions.js';

export class PermissionsRepository {
  async list() {
    return prisma.permission.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findByKey(key: string) {
    return prisma.permission.findUnique({
      where: { key },
    });
  }

  async create(data: { key: string; description?: string }) {
    return prisma.permission.create({ data });
  }

  async findByKeys(keys: string[]) {
    return prisma.permission.findMany({
      where: { key: { in: keys } },
    });
  }

  async resolveKeysForUser(
    userId: string,
    tenantId: string,
  ): Promise<PermissionKeyValue[]> {
    const assignments = await prisma.userRoleAssignment.findMany({
      where: { userId, tenantId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const keys = new Set<string>();
    for (const assignment of assignments) {
      for (const rolePermission of assignment.role.permissions) {
        keys.add(rolePermission.permission.key);
      }
    }

    return [...keys] as PermissionKeyValue[];
  }
}

export const permissionsRepository = new PermissionsRepository();
