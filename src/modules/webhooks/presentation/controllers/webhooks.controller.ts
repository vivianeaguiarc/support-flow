import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { webhooksService } from '../../application/services/webhooks.service.js';
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
} from '../dtos/webhook.dto.js';

export class WebhooksController {
  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const webhook = await webhooksService.create(
        getAuthenticatedUser(req),
        req.body as CreateWebhookDto,
      );
      sendSuccess(res, webhook, { status: 201 });
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
      const webhooks = await webhooksService.list(getAuthenticatedUser(req));
      sendSuccess(res, webhooks);
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
      const webhook = await webhooksService.getById(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, webhook);
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
      const webhook = await webhooksService.update(
        getAuthenticatedUser(req),
        req.params.id as string,
        req.body as UpdateWebhookDto,
      );
      sendSuccess(res, webhook);
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
      await webhooksService.delete(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, { deleted: true });
    } catch (error) {
      next(error);
    }
  };

  test = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const delivery = await webhooksService.test(
        getAuthenticatedUser(req),
        req.params.id as string,
      );
      sendSuccess(res, delivery);
    } catch (error) {
      next(error);
    }
  };
}

export const webhooksController = new WebhooksController();
