import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { apiKeysService } from '../../application/services/api-keys.service.js';
import type { CreateApiKeyDto } from '../dtos/create-api-key.dto.js';

export class ApiKeysController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const apiKey = await apiKeysService.create(
        getAuthenticatedUser(req),
        req.body as CreateApiKeyDto,
      );
      sendSuccess(res, apiKey, { status: 201 });
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
      const apiKeys = await apiKeysService.list(getAuthenticatedUser(req));
      sendSuccess(res, apiKeys);
    } catch (error) {
      next(error);
    }
  };

  revoke = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const apiKey = await apiKeysService.revoke(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, apiKey);
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
      await apiKeysService.delete(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };
}

export const apiKeysController = new ApiKeysController();
