import { Router } from 'express';
import { z } from 'zod';

import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { ticketsController } from '../controllers/tickets.controller.js';
import { assignTicketAgentSchema } from '../dtos/assign-ticket-agent.dto.js';
import { createTicketSchema } from '../dtos/create-ticket.dto.js';
import { updateTicketStatusSchema } from '../dtos/update-ticket-status.dto.js';

const idParamSchema = z.object({
  id: z.uuid('Invalid ticket ID'),
});

const customerIdParamSchema = z.object({
  customerId: z.uuid('Invalid customer ID'),
});

const agentIdParamSchema = z.object({
  agentId: z.uuid('Invalid agent ID'),
});

export const ticketsRouter = Router();

ticketsRouter.post(
  '/',
  validateRequest({ body: createTicketSchema }),
  ticketsController.create,
);

ticketsRouter.get('/', ticketsController.list);

ticketsRouter.get(
  '/customer/:customerId',
  validateRequest({ params: customerIdParamSchema }),
  ticketsController.listByCustomerId,
);

ticketsRouter.get(
  '/agent/:agentId',
  validateRequest({ params: agentIdParamSchema }),
  ticketsController.listByAssignedAgentId,
);

ticketsRouter.patch(
  '/:id/status',
  validateRequest({ params: idParamSchema, body: updateTicketStatusSchema }),
  ticketsController.updateStatus,
);

ticketsRouter.patch(
  '/:id/assign-agent',
  validateRequest({ params: idParamSchema, body: assignTicketAgentSchema }),
  ticketsController.assignAgent,
);

ticketsRouter.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  ticketsController.findById,
);
