import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import {
  NotificationsService,
  notificationsService,
} from '../../application/services/notifications.service.js';
import type { ListNotificationsQueryDto } from '../dtos/list-notifications-query.dto.js';

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
      const id = getRouteParam(req.params, 'id');

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
