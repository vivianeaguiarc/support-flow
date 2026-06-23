import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { notificationsController } from '../controllers/notifications.controller.js';
import { listNotificationsQuerySchema } from '../dtos/list-notifications-query.dto.js';
import { notificationIdParamSchema } from '../dtos/notification-id-param.dto.js';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/',
  authenticate,
  validateRequest({ query: listNotificationsQuerySchema }),
  notificationsController.list,
);

notificationsRouter.patch(
  '/:id/read',
  authenticate,
  validateRequest({ params: notificationIdParamSchema }),
  notificationsController.markAsRead,
);

notificationsRouter.patch(
  '/read-all',
  authenticate,
  notificationsController.markAllAsRead,
);
