import { AppError } from '../../../../shared/errors/app-error.js';
import { securityAuditService } from '../../../../shared/security/security-audit/security-audit.service.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import {
  PermissionsRepository,
  permissionsRepository as defaultPermissionsRepository,
} from '../../infrastructure/repositories/permissions.repository.js';
import type { CreatePermissionDto } from '../../presentation/dtos/permission.dto.js';

export class PermissionsAdminService {
  constructor(
    private readonly repository: PermissionsRepository = defaultPermissionsRepository,
  ) {}

  async list() {
    return this.repository.list();
  }

  async create(authUser: AuthenticatedUser, input: CreatePermissionDto) {
    const existing = await this.repository.findByKey(input.key);
    if (existing) {
      throw new AppError('Permission key already exists', 409);
    }

    const permission = await this.repository.create(input);

    void securityAuditService.record('USER_PERMISSION_ASSIGNED', {
      tenantId: authUser.tenantId,
      actorId: authUser.id,
      metadata: {
        action: 'permission_catalog_created',
        permissionKey: permission.key,
      },
    });

    return permission;
  }
}

export const permissionsAdminService = new PermissionsAdminService();
