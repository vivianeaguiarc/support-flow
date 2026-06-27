import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { slaPoliciesService } from '../../application/services/sla-policies.service.js';
import type {
  CreateSlaPolicyDto,
  ListSlaPoliciesQueryDto,
  UpdateSlaPolicyDto,
} from '../dtos/sla-policy.dto.js';

export class SlaPoliciesController {
  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policies = await slaPoliciesService.list(
        getAuthenticatedUser(req),
        req.query as unknown as ListSlaPoliciesQueryDto,
      );
      sendSuccess(res, policies);
    } catch (error) {
      next(error);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policy = await slaPoliciesService.getById(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, policy);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const policy = await slaPoliciesService.create(
        getAuthenticatedUser(req),
        req.body as CreateSlaPolicyDto,
      );
      sendSuccess(res, policy, { status: 201 });
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
      const policy = await slaPoliciesService.update(
        getAuthenticatedUser(req),
        req.params.id as string,
        req.body as UpdateSlaPolicyDto,
      );
      sendSuccess(res, policy);
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
      await slaPoliciesService.delete(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const slaPoliciesController = new SlaPoliciesController();
