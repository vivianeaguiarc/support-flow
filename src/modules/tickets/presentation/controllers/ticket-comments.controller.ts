import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';
import type { CreateTicketCommentDto } from '../dtos/create-ticket-comment.dto.js';

export class TicketCommentsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');
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
      const id = getRouteParam(req.params, 'id');

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
