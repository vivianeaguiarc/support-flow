import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { automationRulesController } from '../controllers/automation-rules.controller.js';
import {
  automationRuleIdParamSchema,
  createAutomationRuleSchema,
  updateAutomationRuleSchema,
} from '../dtos/automation-rule.dto.js';

export const automationRouter = Router();

const adminOnly = [authenticate, authorize(...ROLE_GROUPS.USER_ADMIN)] as const;

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
