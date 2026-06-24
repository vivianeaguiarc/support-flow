import { AppError } from '../../../../shared/errors/app-error.js';
import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import { securityAuditService } from '../../../../shared/security/security-audit/security-audit.service.js';
import { resolveTenantId } from '../../../../shared/tenant/get-request-tenant-id.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import {
  PermissionsRepository,
  permissionsRepository as defaultPermissionsRepository,
} from '../../infrastructure/repositories/permissions.repository.js';
import {
  RolesRepository,
  rolesRepository as defaultRolesRepository,
} from '../../infrastructure/repositories/roles.repository.js';
import type {
  AssignRolePermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../../presentation/dtos/role.dto.js';

function toRoleResponse(
  role: Awaited<ReturnType<RolesRepository['findByIdAndTenant']>>,
) {
  if (!role) {
    return null;
  }

  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions.map((entry) => ({
      id: entry.permission.id,
      key: entry.permission.key,
      description: entry.permission.description,
    })),
  };
}

export class RolesAdminService {
  constructor(
    private readonly rolesRepository: RolesRepository = defaultRolesRepository,
    private readonly permissionsRepository: PermissionsRepository = defaultPermissionsRepository,
  ) {}

  async list(authUser: AuthenticatedUser) {
    const tenantId = resolveTenantId(authUser);
    const roles = await this.rolesRepository.listByTenant(tenantId);

    return roles.map((role) => ({
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: role.permissions.map((entry) => ({
        id: entry.permission.id,
        key: entry.permission.key,
        description: entry.permission.description,
      })),
    }));
  }

  async create(authUser: AuthenticatedUser, input: CreateRoleDto) {
    const tenantId = resolveTenantId(authUser);
    const role = await this.rolesRepository.create({
      tenantId,
      name: input.name,
      description: input.description,
    });

    void securityAuditService.record('ROLE_CREATED', {
      tenantId,
      actorId: authUser.id,
      metadata: {
        roleId: role.id,
        name: role.name,
      },
    });

    return toRoleResponse(
      await this.rolesRepository.findByIdAndTenant(role.id, tenantId),
    );
  }

  async update(
    authUser: AuthenticatedUser,
    roleId: string,
    input: UpdateRoleDto,
  ) {
    const tenantId = resolveTenantId(authUser);
    const existing = await this.rolesRepository.findByIdAndTenant(
      roleId,
      tenantId,
    );

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    await this.rolesRepository.update(roleId, tenantId, input);

    void securityAuditService.record('ROLE_UPDATED', {
      tenantId,
      actorId: authUser.id,
      metadata: {
        roleId,
        changes: input,
      },
    });

    return toRoleResponse(
      await this.rolesRepository.findByIdAndTenant(roleId, tenantId),
    );
  }

  async delete(authUser: AuthenticatedUser, roleId: string) {
    const tenantId = resolveTenantId(authUser);
    const existing = await this.rolesRepository.findByIdAndTenant(
      roleId,
      tenantId,
    );

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    await this.rolesRepository.delete(roleId, tenantId);

    void securityAuditService.record('ROLE_DELETED', {
      tenantId,
      actorId: authUser.id,
      metadata: {
        roleId,
        name: existing.name,
      },
    });
  }

  async assignPermissions(
    authUser: AuthenticatedUser,
    roleId: string,
    input: AssignRolePermissionsDto,
  ) {
    const tenantId = resolveTenantId(authUser);
    const existing = await this.rolesRepository.findByIdAndTenant(
      roleId,
      tenantId,
    );

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    const permissions = await this.permissionsRepository.findByKeys(
      input.permissionKeys,
    );

    if (permissions.length !== input.permissionKeys.length) {
      throw new AppError('One or more permission keys are invalid', 400);
    }

    await this.rolesRepository.replacePermissions(
      roleId,
      permissions.map((permission: { id: string }) => permission.id),
    );

    void securityAuditService.record('ROLE_PERMISSIONS_UPDATED', {
      tenantId,
      actorId: authUser.id,
      metadata: {
        roleId,
        permissionKeys: input.permissionKeys,
      },
    });

    return toRoleResponse(
      await this.rolesRepository.findByIdAndTenant(roleId, tenantId),
    );
  }
}

export const rolesAdminService = new RolesAdminService();
