import type { NextFunction, Request, Response } from 'express';

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
      const { id } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const forceRecalculation = req.body?.forceRecalculation === true;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant ID not found' });
        return;
      }

      const ticket = await this.recalculateUseCase.execute({
        ticketId: id,
        tenantId,
        changedById: userId,
        forceRecalculation,
      });

      res.status(200).json(ticket);
    } catch (error) {
      next(error);
    }
  };
}

export const ticketPriorityController = new TicketPriorityController();
