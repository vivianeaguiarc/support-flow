import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { automationRulesService } from '../../application/services/automation-rules.service.js';
import type {
  CreateAutomationRuleDto,
  UpdateAutomationRuleDto,
} from '../dtos/automation-rule.dto.js';

export class AutomationRulesController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rule = await automationRulesService.create(
        getAuthenticatedUser(req),
        req.body as CreateAutomationRuleDto,
      );
      sendSuccess(res, rule, { status: 201 });
    } catch (error) {
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rules = await automationRulesService.list(
        getAuthenticatedUser(req),
      );
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rule = await automationRulesService.update(
        getAuthenticatedUser(req),
        req.params.id as string,
        req.body as UpdateAutomationRuleDto,
      );
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  };

  remove = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await automationRulesService.delete(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const automationRulesController = new AutomationRulesController();
