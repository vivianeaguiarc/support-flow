import type { NextFunction, Request, Response } from 'express';

import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { notificationService } from '../../application/services/notification.service.js';

export class AdminNotificationsController {
  health = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const health = await notificationService.checkHealth();
      sendSuccess(res, health);
    } catch (error) {
      next(error);
    }
  };
}

export const adminNotificationsController = new AdminNotificationsController();
