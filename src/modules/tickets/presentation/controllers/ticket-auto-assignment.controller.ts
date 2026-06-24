import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../../shared/errors/http-errors.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import { ticketAutoAssignmentService } from '../../application/services/ticket-auto-assignment.service.js';

export class TicketAutoAssignmentController {
  autoAssign = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        throw new UnauthorizedError('Tenant ID not found');
      }

      const result =
        await ticketAutoAssignmentService.autoAssignTickets(tenantId);

      sendSuccess(res, result, {
        message: 'Auto-assignment completed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketAutoAssignmentController =
  new TicketAutoAssignmentController();
