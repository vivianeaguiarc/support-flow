import type { NextFunction, Request, Response } from 'express';

import { getAuthenticatedUser } from '../../../../shared/http/helpers/get-authenticated-user.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { submitTicketSatisfactionUseCase } from '../../application/use-cases/submit-ticket-satisfaction.use-case.js';
import type { SubmitTicketSatisfactionDto } from '../dtos/submit-ticket-satisfaction.dto.js';

export class TicketSatisfactionController {
  submit = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = getAuthenticatedUser(req);
      const body = req.body as SubmitTicketSatisfactionDto;

      const survey = await submitTicketSatisfactionUseCase.execute({
        ticketId: req.params.ticketId as string,
        tenantId: authUser.tenantId,
        authUser,
        rating: body.rating,
        comment: body.comment,
      });

      sendSuccess(res, survey, { status: 201 });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketSatisfactionController = new TicketSatisfactionController();
