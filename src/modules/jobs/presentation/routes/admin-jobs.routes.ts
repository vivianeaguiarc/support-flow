import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { adminJobsController } from '../controllers/admin-jobs.controller.js';

export const adminJobsRouter = Router();

const adminOnly = [authenticate, authorize(...ROLE_GROUPS.USER_ADMIN)] as const;

adminJobsRouter.get('/', ...adminOnly, adminJobsController.list);
adminJobsRouter.get('/metrics', ...adminOnly, adminJobsController.metrics);
