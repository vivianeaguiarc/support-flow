import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../shared/http/middlewares/authorize.js';
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
  authenticate,
  authorize(UserRole.CUSTOMER),
  validateRequest({ body: createTicketSchema }),
  ticketsController.create,
);

ticketsRouter.get(
  '/',
  authenticate,
  authorize(UserRole.AGENT),
  ticketsController.list,
);

ticketsRouter.get(
  '/customer/:customerId',
  authenticate,
  authorize(UserRole.CUSTOMER),
  validateRequest({ params: customerIdParamSchema }),
  ticketsController.listByCustomerId,
);

ticketsRouter.get(
  '/agent/:agentId',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({ params: agentIdParamSchema }),
  ticketsController.listByAssignedAgentId,
);

ticketsRouter.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({ params: idParamSchema, body: updateTicketStatusSchema }),
  ticketsController.updateStatus,
);

ticketsRouter.patch(
  '/:id/assign-agent',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({ params: idParamSchema, body: assignTicketAgentSchema }),
  ticketsController.assignAgent,
);

ticketsRouter.get(
  '/:id',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({ params: idParamSchema }),
  ticketsController.findById,
);
