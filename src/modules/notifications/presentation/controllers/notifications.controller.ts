import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
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

      sendSuccess(res, notifications);
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

      sendSuccess(res, null, {
        message: 'Notification marked as read successfully',
      });
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

      sendSuccess(res, result, {
        message: 'All notifications marked as read successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController();
