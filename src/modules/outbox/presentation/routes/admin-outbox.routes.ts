import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { outboxAdminController } from '../controllers/outbox-admin.controller.js';
import { listOutboxQuerySchema } from '../dtos/list-outbox-query.dto.js';

export const adminOutboxRouter = Router();

const adminOnly = [
  authenticate,
  requirePermission(PermissionKey.USERS_MANAGE),
] as const;

adminOutboxRouter.get(
  '/',
  ...adminOnly,
  validateRequest({ query: listOutboxQuerySchema }),
  outboxAdminController.list,
);

adminOutboxRouter.get('/metrics', ...adminOnly, outboxAdminController.metrics);
