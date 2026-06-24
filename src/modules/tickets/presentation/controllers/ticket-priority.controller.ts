import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../../shared/errors/http-errors.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import {
  type RecalculateTicketPriorityUseCase,
  recalculateTicketPriorityUseCase,
} from '../../application/use-cases/recalculate-ticket-priority.use-case.js';

export class TicketPriorityController {
  constructor(
    private readonly recalculateUseCase: RecalculateTicketPriorityUseCase = recalculateTicketPriorityUseCase,
  ) {}

  recalculatePriority = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const forceRecalculation = req.body?.forceRecalculation === true;

      if (!tenantId) {
        throw new UnauthorizedError('Tenant ID not found');
      }

      const ticket = await this.recalculateUseCase.execute({
        ticketId: id,
        tenantId,
        changedById: userId,
        forceRecalculation,
      });

      sendSuccess(res, ticket, {
        message: 'Ticket priority recalculated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketPriorityController = new TicketPriorityController();
