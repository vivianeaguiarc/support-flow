import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { apiKeyRateLimit } from '../../../../shared/http/middlewares/sensitive-rate-limits.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { apiKeysController } from '../controllers/api-keys.controller.js';
import {
  apiKeyIdParamSchema,
  createApiKeySchema,
} from '../dtos/create-api-key.dto.js';

export const apiKeysRouter = Router();

const adminOnly = [
  authenticate,
  requirePermission(PermissionKey.API_KEYS_MANAGE),
] as const;

apiKeysRouter.post(
  '/',
  ...apiKeyRateLimit,
  ...adminOnly,
  validateRequest({ body: createApiKeySchema }),
  apiKeysController.create,
);

apiKeysRouter.get('/', ...adminOnly, apiKeysController.list);

apiKeysRouter.patch(
  '/:id/revoke',
  ...apiKeyRateLimit,
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
