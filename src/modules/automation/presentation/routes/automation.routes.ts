import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { automationRulesController } from '../controllers/automation-rules.controller.js';
import {
  automationRuleIdParamSchema,
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
} from '../dtos/automation-rule.dto.js';

export const automationRouter = Router();

const adminOnly = [
  authenticate,
  requirePermission(PermissionKey.AUTOMATION_MANAGE),
] as const;

automationRouter.post(
  '/rules',
  ...adminOnly,
  validateRequest({ body: createAutomationRuleSchema }),
  automationRulesController.create,
);

automationRouter.get('/rules', ...adminOnly, automationRulesController.list);

automationRouter.patch(
  '/rules/:id',
  ...adminOnly,
  validateRequest({
    params: automationRuleIdParamSchema,
    body: updateAutomationRuleSchema,
  }),
  automationRulesController.update,
);

automationRouter.delete(
  '/rules/:id',
  ...adminOnly,
  validateRequest({ params: automationRuleIdParamSchema }),
  automationRulesController.remove,
);
