import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../../shared/errors/app-error.js';
import { handleMulterError } from '../../../../shared/http/middlewares/upload.middleware.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  return req.user;
}

export class TicketAttachmentsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  upload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!req.file) {
        throw new AppError('File is required', 400);
      }

      const attachment = await this.service.uploadAttachment(
        id,
        req.file,
        getAuthenticatedUser(req),
      );

      res.status(201).json({
        ...attachment,
        size: attachment.size.toString(),
      });
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
      const { id } = req.params;

      const attachments = await this.service.getAttachments(
        id,
        getAuthenticatedUser(req),
      );

      res.status(200).json(
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
      const { id, attachmentId } = req.params;

      await this.service.removeAttachment(
        id,
        attachmentId,
        getAuthenticatedUser(req),
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

export const ticketAttachmentsController = new TicketAttachmentsController();
