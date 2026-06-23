import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../../../shared/errors/app-error.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';
import type { CreateTicketCommentDto } from '../dtos/create-ticket-comment.dto.js';

function getAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError('Unauthorized', 401);
  }

  return req.user;
}

export class TicketCommentsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { content } = req.body as CreateTicketCommentDto;

      const comment = await this.service.addComment(
        id,
        content,
        getAuthenticatedUser(req),
      );

      res.status(201).json(comment);
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
      const { id } = req.params;

      const comments = await this.service.getComments(
        id,
        getAuthenticatedUser(req),
      );

      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  };
}

export const ticketCommentsController = new TicketCommentsController();
