import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { webhookRateLimit } from '../../../../shared/http/middlewares/sensitive-rate-limits.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { webhooksController } from '../controllers/webhooks.controller.js';
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookIdParamSchema,
} from '../dtos/webhook.dto.js';

export const webhooksRouter = Router();

const adminOnly = [authenticate, authorize(...ROLE_GROUPS.USER_ADMIN)] as const;

webhooksRouter.post(
  '/',
  ...webhookRateLimit,
  ...adminOnly,
  validateRequest({ body: createWebhookSchema }),
  webhooksController.create,
);

webhooksRouter.get('/', ...adminOnly, webhooksController.list);

webhooksRouter.get(
  '/:id',
  ...adminOnly,
  validateRequest({ params: webhookIdParamSchema }),
  webhooksController.getById,
);

webhooksRouter.patch(
  '/:id',
  ...webhookRateLimit,
  ...adminOnly,
  validateRequest({ params: webhookIdParamSchema, body: updateWebhookSchema }),
  webhooksController.update,
);

webhooksRouter.delete(
  '/:id',
  ...adminOnly,
  validateRequest({ params: webhookIdParamSchema }),
  webhooksController.remove,
);

webhooksRouter.post(
  '/:id/test',
  ...webhookRateLimit,
  ...adminOnly,
  validateRequest({ params: webhookIdParamSchema }),
  webhooksController.test,
);
