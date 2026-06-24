import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { adminAuditRouter } from '../../../audit/presentation/routes/admin-audit.routes.js';
import { adminFeatureFlagsRouter } from '../../../feature-flags/presentation/routes/admin-feature-flags.routes.js';
import { adminJobsRouter } from '../../../jobs/presentation/routes/admin-jobs.routes.js';
import { adminOutboxRouter } from '../../../outbox/presentation/routes/admin-outbox.routes.js';
import {
  adminPermissionsRouter,
  adminRolesRouter,
} from '../../../rbac/presentation/routes/admin-rbac.routes.js';
import { adminNotificationsController } from '../controllers/admin-notifications.controller.js';

export const adminNotificationsRouter = Router();

adminNotificationsRouter.get(
  '/health',
  authenticate,
  requirePermission(PermissionKey.USERS_MANAGE),
  adminNotificationsController.health,
);

export const adminRouter = Router();
adminRouter.use('/notifications', adminNotificationsRouter);
adminRouter.use('/jobs', adminJobsRouter);
adminRouter.use('/feature-flags', adminFeatureFlagsRouter);
adminRouter.use('/roles', adminRolesRouter);
adminRouter.use('/permissions', adminPermissionsRouter);
adminRouter.use('/outbox', adminOutboxRouter);
adminRouter.use('/audit-logs', adminAuditRouter);
