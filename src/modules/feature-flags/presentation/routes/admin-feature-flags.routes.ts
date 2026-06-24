import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { adminFeatureFlagsController } from '../controllers/admin-feature-flags.controller.js';
import {
  createFeatureFlagSchema,
  featureFlagKeyParamSchema,
  updateFeatureFlagSchema,
} from '../dtos/feature-flag.dto.js';

export const adminFeatureFlagsRouter = Router();

const adminOnly = [authenticate, authorize(...ROLE_GROUPS.USER_ADMIN)] as const;

adminFeatureFlagsRouter.post(
  '/',
  ...adminOnly,
  validateRequest({ body: createFeatureFlagSchema }),
  adminFeatureFlagsController.create,
);

adminFeatureFlagsRouter.get(
  '/',
  ...adminOnly,
  adminFeatureFlagsController.list,
);

adminFeatureFlagsRouter.patch(
  '/:key',
  ...adminOnly,
  validateRequest({
    params: featureFlagKeyParamSchema,
    body: updateFeatureFlagSchema,
  }),
  adminFeatureFlagsController.update,
);

adminFeatureFlagsRouter.delete(
  '/:key',
  ...adminOnly,
  validateRequest({ params: featureFlagKeyParamSchema }),
  adminFeatureFlagsController.remove,
);
