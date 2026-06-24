import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { adminJobsController } from '../controllers/admin-jobs.controller.js';

export const adminJobsRouter = Router();

const adminOnly = [
  authenticate,
  requirePermission(PermissionKey.USERS_MANAGE),
] as const;

adminJobsRouter.get('/', ...adminOnly, adminJobsController.list);
adminJobsRouter.get('/metrics', ...adminOnly, adminJobsController.metrics);
