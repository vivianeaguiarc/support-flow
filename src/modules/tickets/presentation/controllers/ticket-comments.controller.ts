import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import {
  TicketsService,
  ticketsService,
} from '../../application/services/tickets.service.js';
import type { CreateTicketCommentDto } from '../dtos/create-ticket-comment.dto.js';
import {
  toTicketCommentResponse,
  toTicketCommentWithAuthorResponse,
} from '../mappers/to-ticket-comment-response.js';

function resolveTicketId(req: Request): string {
  if (typeof req.params.ticketId === 'string') {
    return getRouteParam(req.params, 'ticketId');
  }

  return getRouteParam(req.params, 'id');
}

export class TicketCommentsController {
  constructor(private readonly service: TicketsService = ticketsService) {}

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ticketId = resolveTicketId(req);
      const { content, visibility } = req.body as CreateTicketCommentDto;

      const comment = await this.service.addComment(
        ticketId,
        content,
        getAuthenticatedUser(req),
        visibility,
      );

      sendSuccess(res, toTicketCommentResponse(comment), {
        status: 201,
        message: 'Comment created successfully',
      });
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
      const ticketId = resolveTicketId(req);

      const comments = await this.service.getComments(
        ticketId,
        getAuthenticatedUser(req),
      );

      sendSuccess(res, comments.map(toTicketCommentWithAuthorResponse));
    } catch (error) {
      next(error);
    }
  };
}

export const ticketCommentsController = new TicketCommentsController();
