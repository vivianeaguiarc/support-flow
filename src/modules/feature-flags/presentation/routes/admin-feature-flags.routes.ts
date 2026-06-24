import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { adminFeatureFlagsController } from '../controllers/admin-feature-flags.controller.js';
import {
  createFeatureFlagSchema,
  featureFlagKeyParamSchema,
  updateFeatureFlagSchema,
} from '../dtos/feature-flag.dto.js';

export const adminFeatureFlagsRouter = Router();

const platformAdminOnly = [
  authenticate,
  requirePermission(PermissionKey.FEATURE_FLAGS_MANAGE),
] as const;

adminFeatureFlagsRouter.post(
  '/',
  ...platformAdminOnly,
  validateRequest({ body: createFeatureFlagSchema }),
  adminFeatureFlagsController.create,
);

adminFeatureFlagsRouter.get(
  '/',
  ...platformAdminOnly,
  adminFeatureFlagsController.list,
);

adminFeatureFlagsRouter.patch(
  '/:key',
  ...platformAdminOnly,
  validateRequest({
    params: featureFlagKeyParamSchema,
    body: updateFeatureFlagSchema,
  }),
  adminFeatureFlagsController.update,
);

adminFeatureFlagsRouter.delete(
  '/:key',
  ...platformAdminOnly,
  validateRequest({ params: featureFlagKeyParamSchema }),
  adminFeatureFlagsController.remove,
);
