import { UserRole } from '@prisma/client';
import { Router } from 'express';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../shared/http/middlewares/authorize.js';
import { upload } from '../../../shared/http/middlewares/upload.middleware.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { ticketAttachmentsController } from '../controllers/ticket-attachments.controller.js';
import { ticketCommentsController } from '../controllers/ticket-comments.controller.js';
import { ticketsController } from '../controllers/tickets.controller.js';
import { assignTicketSchema } from '../dtos/assign-ticket.dto.js';
import { createTicketSchema } from '../dtos/create-ticket.dto.js';
import { createTicketCommentSchema } from '../dtos/create-ticket-comment.dto.js';
import { listTicketsQuerySchema } from '../dtos/list-tickets-query.dto.js';
import { ticketIdParamSchema } from '../dtos/ticket-id-param.dto.js';
import { ticketMetricsQuerySchema } from '../dtos/ticket-metrics-query.dto.js';
import { ticketSummaryQuerySchema } from '../dtos/ticket-summary-query.dto.js';
import { updateTicketStatusSchema } from '../dtos/update-ticket-status.dto.js';

export const ticketsRouter = Router();

ticketsRouter.post(
  '/',
  authenticate,
  authorize(UserRole.CUSTOMER, UserRole.AGENT),
  validateRequest({ body: createTicketSchema }),
  ticketsController.create,
);

ticketsRouter.get(
  '/',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ query: listTicketsQuerySchema }),
  ticketsController.list,
);

ticketsRouter.get(
  '/summary',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ query: ticketSummaryQuerySchema }),
  ticketsController.summary,
);

ticketsRouter.get(
  '/metrics',
  authenticate,
  authorize(UserRole.AGENT, UserRole.ADMIN),
  validateRequest({ query: ticketMetricsQuerySchema }),
  ticketsController.metrics,
);

ticketsRouter.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({
    params: ticketIdParamSchema,
    body: updateTicketStatusSchema,
  }),
  ticketsController.updateStatus,
);

ticketsRouter.patch(
  '/:id/assign',
  authenticate,
  authorize(UserRole.AGENT),
  validateRequest({ params: ticketIdParamSchema, body: assignTicketSchema }),
  ticketsController.assign,
);

ticketsRouter.get(
  '/:id/transitions',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.getStatusTransitions,
);

ticketsRouter.get(
  '/:id/history',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.getHistory,
);

ticketsRouter.post(
  '/:id/comments',
  authenticate,
  authorize(UserRole.AGENT, UserRole.ADMIN),
  validateRequest({
    params: ticketIdParamSchema,
    body: createTicketCommentSchema,
  }),
  ticketCommentsController.create,
);

ticketsRouter.get(
  '/:id/comments',
  authenticate,
  authorize(UserRole.AGENT, UserRole.ADMIN),
  validateRequest({ params: ticketIdParamSchema }),
  ticketCommentsController.list,
);

ticketsRouter.post(
  '/:id/attachments',
  authenticate,
  authorize(UserRole.AGENT, UserRole.ADMIN),
  validateRequest({ params: ticketIdParamSchema }),
  upload.single('file'),
  ticketAttachmentsController.upload,
);

ticketsRouter.get(
  '/:id/attachments',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ params: ticketIdParamSchema }),
  ticketAttachmentsController.list,
);

ticketsRouter.delete(
  '/:id/attachments/:attachmentId',
  authenticate,
  authorize(UserRole.AGENT, UserRole.ADMIN),
  ticketAttachmentsController.delete,
);

ticketsRouter.get(
  '/:id',
  authenticate,
  authorize(UserRole.AGENT, UserRole.CUSTOMER),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.findById,
);
