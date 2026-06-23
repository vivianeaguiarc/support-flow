import type { Request, Response } from 'express';

import { ticketAutoAssignmentService } from '../services/ticket-auto-assignment.service.js';

export class TicketAutoAssignmentController {
  async autoAssign(req: Request, res: Response): Promise<void> {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      res.status(401).json({ error: 'Tenant ID not found' });
      return;
    }

    const result =
      await ticketAutoAssignmentService.autoAssignTickets(tenantId);

    res.status(200).json(result);
  }
}

export const ticketAutoAssignmentController =
  new TicketAutoAssignmentController();
