import {
  LEGACY_ROLE_PERMISSIONS,
  type PermissionKeyValue,
} from '../../../../shared/security/permissions.js';
import { isSuperAdmin } from '../../../../shared/security/rbac.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import {
  PermissionsRepository,
  permissionsRepository as defaultPermissionsRepository,
} from '../../infrastructure/repositories/permissions.repository.js';

export class PermissionResolverService {
  constructor(
    private readonly repository: PermissionsRepository = defaultPermissionsRepository,
  ) {}

  async resolve(user: AuthenticatedUser): Promise<Set<PermissionKeyValue>> {
    if (isSuperAdmin(user.role)) {
      return new Set(LEGACY_ROLE_PERMISSIONS[user.role]);
    }

    const tenantId = user.scopedTenantId ?? user.tenantId;
    const fromAssignments = await this.repository.resolveKeysForUser(
      user.id,
      tenantId,
    );
    const fromLegacy = LEGACY_ROLE_PERMISSIONS[user.role];

    return new Set([...fromAssignments, ...fromLegacy]);
  }

  async resolveAssignedOnly(
    user: AuthenticatedUser,
  ): Promise<Set<PermissionKeyValue>> {
    if (isSuperAdmin(user.role)) {
      return new Set();
    }

    const tenantId = user.scopedTenantId ?? user.tenantId;
    const fromAssignments = await this.repository.resolveKeysForUser(
      user.id,
      tenantId,
    );

    return new Set(fromAssignments);
  }
}

export const permissionResolverService = new PermissionResolverService();
