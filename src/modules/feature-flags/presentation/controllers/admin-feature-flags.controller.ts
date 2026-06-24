import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { featureFlagService } from '../../application/services/feature-flag.service.js';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from '../dtos/feature-flag.dto.js';

export class AdminFeatureFlagsController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const flag = await featureFlagService.create(
        getAuthenticatedUser(req),
        req.body as CreateFeatureFlagDto,
      );
      sendSuccess(res, flag, { status: 201 });
    } catch (error) {
      next(error);
    }
  };

  list = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const flags = await featureFlagService.list();
      sendSuccess(res, flags);
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
      const flag = await featureFlagService.updateByKey(
        getAuthenticatedUser(req),
        req.params.key as string,
        req.body as UpdateFeatureFlagDto,
      );
      sendSuccess(res, flag);
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
      await featureFlagService.deleteByKey(
        getAuthenticatedUser(req),
        req.params.key as string,
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const adminFeatureFlagsController = new AdminFeatureFlagsController();
