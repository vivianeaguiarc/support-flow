import type { NextFunction, Request, Response } from 'express';

import { getRouteParam } from '../../../../shared/http/request-params.js';
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
        res.status(401).json({ error: 'Tenant ID not found' });
        return;
      }

      const result = await this.routeUseCase.execute({
        ticketId: id,
        tenantId,
        changedById: userId,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const ticketRoutingController = new TicketRoutingController();
