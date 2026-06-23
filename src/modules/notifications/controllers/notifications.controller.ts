import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../shared/errors/app-error.js';
import type { ListNotificationsQueryDto } from '../dtos/list-notifications-query.dto.js';
import {
  NotificationsService,
  notificationsService,
} from '../services/notifications.service.js';

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  return req.user;
}

export class NotificationsController {
  constructor(
    private readonly service: NotificationsService = notificationsService,
  ) {}

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { unread, limit, offset } =
        req.query as unknown as ListNotificationsQueryDto;

      const notifications = await this.service.getUserNotifications(
        getAuthenticatedUser(req),
        unread,
        limit,
        offset,
      );

      res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.service.markAsRead(id, getAuthenticatedUser(req));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.service.markAllAsRead(
        getAuthenticatedUser(req),
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController();
