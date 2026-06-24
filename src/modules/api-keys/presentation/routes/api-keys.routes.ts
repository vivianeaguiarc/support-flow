import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { apiKeysController } from '../controllers/api-keys.controller.js';
import {
  apiKeyIdParamSchema,
  createApiKeySchema,
} from '../dtos/create-api-key.dto.js';

export const apiKeysRouter = Router();

const adminOnly = [authenticate, authorize(...ROLE_GROUPS.USER_ADMIN)] as const;

apiKeysRouter.post(
  '/',
  ...adminOnly,
  validateRequest({ body: createApiKeySchema }),
  apiKeysController.create,
);

apiKeysRouter.get('/', ...adminOnly, apiKeysController.list);

apiKeysRouter.patch(
  '/:id/revoke',
  ...adminOnly,
  validateRequest({ params: apiKeyIdParamSchema }),
  apiKeysController.revoke,
);

apiKeysRouter.delete(
  '/:id',
  ...adminOnly,
  validateRequest({ params: apiKeyIdParamSchema }),
  apiKeysController.remove,
);
