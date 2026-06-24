import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { adminJobsRouter } from '../../../jobs/presentation/routes/admin-jobs.routes.js';
import { adminNotificationsController } from '../controllers/admin-notifications.controller.js';

export const adminNotificationsRouter = Router();

adminNotificationsRouter.get(
  '/health',
  authenticate,
  authorize(...ROLE_GROUPS.USER_ADMIN),
  adminNotificationsController.health,
);

export const adminRouter = Router();
adminRouter.use('/notifications', adminNotificationsRouter);
adminRouter.use('/jobs', adminJobsRouter);
