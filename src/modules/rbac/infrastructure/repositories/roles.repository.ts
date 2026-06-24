import { prisma } from '../../../../shared/database/prisma.js';

export type CreateRoleInput = {
  tenantId: string;
  name: string;
  description?: string;
};

export type UpdateRoleInput = {
  name?: string;
  description?: string | null;
};

export class RolesRepository {
  async listByTenant(tenantId: string) {
    return prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    return prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  }

  async create(data: CreateRoleInput) {
    return prisma.role.create({ data });
  }

  async update(id: string, tenantId: string, data: UpdateRoleInput) {
    return prisma.role.update({
      where: { id, tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    await prisma.role.delete({
      where: { id, tenantId },
    });
  }

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      }),
    ]);
  }
}

export const rolesRepository = new RolesRepository();
