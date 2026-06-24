import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import {
  PermissionsAdminService,
  permissionsAdminService,
} from '../../application/services/permissions-admin.service.js';
import {
  RolesAdminService,
  rolesAdminService,
} from '../../application/services/roles-admin.service.js';
import type { CreatePermissionDto } from '../dtos/permission.dto.js';
import type {
  AssignRolePermissionsDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../dtos/role.dto.js';

export class RbacAdminController {
  constructor(
    private readonly rolesService: RolesAdminService = rolesAdminService,
    private readonly permissionsService: PermissionsAdminService = permissionsAdminService,
  ) {}

  listRoles = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.rolesService.list(getAuthenticatedUser(req));
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.rolesService.create(
        getAuthenticatedUser(req),
        req.body as CreateRoleDto,
      );
      sendSuccess(res, data, { status: 201 });
    } catch (error) {
      next(error);
    }
  };

  updateRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.rolesService.update(
        getAuthenticatedUser(req),
        req.params.id as string,
        req.body as UpdateRoleDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteRole = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.rolesService.delete(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, null, { message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  assignRolePermissions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.rolesService.assignPermissions(
        getAuthenticatedUser(req),
        req.params.id as string,
        req.body as AssignRolePermissionsDto,
      );
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listPermissions = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.permissionsService.list();
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createPermission = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await this.permissionsService.create(
        getAuthenticatedUser(req),
        req.body as CreatePermissionDto,
      );
      sendSuccess(res, data, { status: 201 });
    } catch (error) {
      next(error);
    }
  };
}

export const rbacAdminController = new RbacAdminController();
