import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { rbacAdminController } from '../controllers/rbac-admin.controller.js';
import { createPermissionSchema } from '../dtos/permission.dto.js';
import {
  assignRolePermissionsSchema,
  createRoleSchema,
  roleIdParamSchema,
  updateRoleSchema,
} from '../dtos/role.dto.js';

export const adminRolesRouter = Router();
export const adminPermissionsRouter = Router();

const manageRoles = [
  authenticate,
  requirePermission(PermissionKey.ROLES_MANAGE),
] as const;

adminRolesRouter.post(
  '/',
  ...manageRoles,
  validateRequest({ body: createRoleSchema }),
  rbacAdminController.createRole,
);

adminRolesRouter.get('/', ...manageRoles, rbacAdminController.listRoles);

adminRolesRouter.patch(
  '/:id',
  ...manageRoles,
  validateRequest({ params: roleIdParamSchema, body: updateRoleSchema }),
  rbacAdminController.updateRole,
);

adminRolesRouter.delete(
  '/:id',
  ...manageRoles,
  validateRequest({ params: roleIdParamSchema }),
  rbacAdminController.deleteRole,
);

adminRolesRouter.post(
  '/:id/permissions',
  ...manageRoles,
  validateRequest({
    params: roleIdParamSchema,
    body: assignRolePermissionsSchema,
  }),
  rbacAdminController.assignRolePermissions,
);

adminPermissionsRouter.get(
  '/',
  ...manageRoles,
  rbacAdminController.listPermissions,
);

adminPermissionsRouter.post(
  '/',
  ...manageRoles,
  validateRequest({ body: createPermissionSchema }),
  rbacAdminController.createPermission,
);
