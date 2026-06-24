import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../../shared/errors/app-error.js';
import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { handleMulterError } from '../../../../shared/http/middlewares/upload.middleware.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';

export class TicketAttachmentsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');

      if (!req.file) {
        throw new AppError('File is required', 400);
      }

      const attachment = await this.service.uploadAttachment(
        id,
        req.file,
        getAuthenticatedUser(req),
      );

      sendSuccess(
        res,
        {
          ...attachment,
          size: attachment.size.toString(),
        },
        {
          status: 201,
          message: 'Attachment uploaded successfully',
        },
      );
    } catch (error) {
      handleMulterError(error);
      next(error);
    }
  };

  list = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');

      const attachments = await this.service.getAttachments(
        id,
        getAuthenticatedUser(req),
      );

      sendSuccess(
        res,
        attachments.map((attachment) => ({
          ...attachment,
          size: attachment.size.toString(),
        })),
      );
    } catch (error) {
      next(error);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');
      const attachmentId = getRouteParam(req.params, 'attachmentId');

      await this.service.removeAttachment(
        id,
        attachmentId,
        getAuthenticatedUser(req),
      );

      sendSuccess(res, null, { message: 'Attachment deleted successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketAttachmentsController = new TicketAttachmentsController();
