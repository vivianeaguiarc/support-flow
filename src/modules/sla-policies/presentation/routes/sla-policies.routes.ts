import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { slaPoliciesController } from '../controllers/sla-policies.controller.js';
import {
  createSlaPolicySchema,
  listSlaPoliciesQuerySchema,
  slaPolicyIdParamSchema,
  updateSlaPolicySchema,
} from '../dtos/sla-policy.dto.js';

export const slaPoliciesRouter = Router();

slaPoliciesRouter.use(authenticate);

slaPoliciesRouter.get(
  '/',
  requirePermission(PermissionKey.SLA_POLICIES_READ),
  validateRequest({ query: listSlaPoliciesQuerySchema }),
  slaPoliciesController.list,
);

slaPoliciesRouter.get(
  '/:id',
  requirePermission(PermissionKey.SLA_POLICIES_READ),
  validateRequest({ params: slaPolicyIdParamSchema }),
  slaPoliciesController.getById,
);

slaPoliciesRouter.post(
  '/',
  requirePermission(PermissionKey.SLA_POLICIES_CREATE),
  validateRequest({ body: createSlaPolicySchema }),
  slaPoliciesController.create,
);

slaPoliciesRouter.patch(
  '/:id',
  requirePermission(PermissionKey.SLA_POLICIES_UPDATE),
  validateRequest({
    params: slaPolicyIdParamSchema,
    body: updateSlaPolicySchema,
  }),
  slaPoliciesController.update,
);

slaPoliciesRouter.delete(
  '/:id',
  requirePermission(PermissionKey.SLA_POLICIES_DELETE),
  validateRequest({ params: slaPolicyIdParamSchema }),
  slaPoliciesController.remove,
);
