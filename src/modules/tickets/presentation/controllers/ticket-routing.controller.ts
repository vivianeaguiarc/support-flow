import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../../../shared/errors/http-errors.js';
import { getRouteParam } from '../../../../shared/http/request-params.js';
import { sendSuccess } from '../../../../shared/http/response/api-response.js';
import {
  type RouteTicketUseCase,
  routeTicketUseCase,
} from '../../application/use-cases/route-ticket.use-case.js';

export class TicketRoutingController {
  constructor(
    private readonly routeUseCase: RouteTicketUseCase = routeTicketUseCase,
  ) {}

  route = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = getRouteParam(req.params, 'id');
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId) {
        throw new UnauthorizedError('Tenant ID not found');
      }

      const result = await this.routeUseCase.execute({
        ticketId: id,
        tenantId,
        changedById: userId,
      });

      sendSuccess(res, result, { message: 'Ticket routed successfully' });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketRoutingController = new TicketRoutingController();
