import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { upload } from '../../../../shared/http/middlewares/upload.middleware.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import { ticketAttachmentsController } from '../controllers/ticket-attachments.controller.js';
import { ticketAutoAssignmentController } from '../controllers/ticket-auto-assignment.controller.js';
import { ticketCommentsController } from '../controllers/ticket-comments.controller.js';
import { ticketPriorityController } from '../controllers/ticket-priority.controller.js';
import { ticketRoutingController } from '../controllers/ticket-routing.controller.js';
import { ticketSlaController } from '../controllers/ticket-sla.controller.js';
import { ticketsController } from '../controllers/tickets.controller.js';
import { assignTicketSchema } from '../dtos/assign-ticket.dto.js';
import { createTicketSchema } from '../dtos/create-ticket.dto.js';
import { createTicketCommentSchema } from '../dtos/create-ticket-comment.dto.js';
import { listBreachedSlaTicketsQuerySchema } from '../dtos/list-breached-sla-tickets-query.dto.js';
import { listTicketsQuerySchema } from '../dtos/list-tickets-query.dto.js';
import { queueTicketsQuerySchema } from '../dtos/queue-tickets-query.dto.js';
import { ticketAttachmentParamsSchema } from '../dtos/ticket-attachment-params.dto.js';
import { ticketIdParamSchema } from '../dtos/ticket-id-param.dto.js';
import { ticketInternalCommentsParamsSchema } from '../dtos/ticket-internal-comments-params.dto.js';
import { ticketMetricsQuerySchema } from '../dtos/ticket-metrics-query.dto.js';
import { ticketSummaryQuerySchema } from '../dtos/ticket-summary-query.dto.js';
import { updateTicketStatusSchema } from '../dtos/update-ticket-status.dto.js';

export const ticketsRouter = Router();

ticketsRouter.post(
  '/',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_CREATE),
  validateRequest({ body: createTicketSchema }),
  ticketsController.create,
);

ticketsRouter.get(
  '/',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_LIST),
  validateRequest({ query: listTicketsQuerySchema }),
  ticketsController.list,
);

ticketsRouter.get(
  '/my-queue',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_QUEUE),
  validateRequest({ query: queueTicketsQuerySchema }),
  ticketsController.myQueue,
);

ticketsRouter.get(
  '/unassigned',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.SUPERVISOR),
  validateRequest({ query: queueTicketsQuerySchema }),
  ticketsController.unassigned,
);

ticketsRouter.get(
  '/summary',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_LIST),
  validateRequest({ query: ticketSummaryQuerySchema }),
  ticketsController.summary,
);

ticketsRouter.get(
  '/metrics',
  authenticate,
  authorize(...ROLE_GROUPS.METRICS),
  validateRequest({ query: ticketMetricsQuerySchema }),
  ticketsController.metrics,
);

ticketsRouter.get(
  '/sla/breached',
  authenticate,
  authorize(...ROLE_GROUPS.METRICS),
  validateRequest({ query: listBreachedSlaTicketsQuerySchema }),
  ticketSlaController.listBreached,
);

ticketsRouter.get(
  '/sla',
  authenticate,
  authorize(...ROLE_GROUPS.METRICS),
  ticketSlaController.summary,
);

ticketsRouter.get(
  '/:ticketId/history',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_READ),
  validateRequest({ params: ticketInternalCommentsParamsSchema }),
  ticketsController.getHistory,
);

ticketsRouter.post(
  '/:ticketId/internal-comments',
  authenticate,
  authorize(...ROLE_GROUPS.INTERNAL_COMMENTS),
  validateRequest({
    params: ticketInternalCommentsParamsSchema,
    body: createTicketCommentSchema,
  }),
  ticketCommentsController.create,
);

ticketsRouter.get(
  '/:ticketId/internal-comments',
  authenticate,
  authorize(...ROLE_GROUPS.INTERNAL_COMMENTS),
  validateRequest({ params: ticketInternalCommentsParamsSchema }),
  ticketCommentsController.list,
);

ticketsRouter.post(
  '/auto-assign',
  authenticate,
  authorize(...ROLE_GROUPS.ROUTING),
  ticketAutoAssignmentController.autoAssign,
);

ticketsRouter.patch(
  '/:id/status',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_STATUS, UserRole.OMBUDSMAN),
  validateRequest({
    params: ticketIdParamSchema,
    body: updateTicketStatusSchema,
  }),
  ticketsController.updateStatus,
);

ticketsRouter.patch(
  '/:id/assign',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_ASSIGN),
  validateRequest({ params: ticketIdParamSchema, body: assignTicketSchema }),
  ticketsController.assign,
);

ticketsRouter.patch(
  '/:id/recalculate-priority',
  authenticate,
  authorize(...ROLE_GROUPS.ROUTING),
  validateRequest({ params: ticketIdParamSchema }),
  ticketPriorityController.recalculatePriority,
);

ticketsRouter.post(
  '/:id/route',
  authenticate,
  authorize(...ROLE_GROUPS.ROUTING),
  validateRequest({ params: ticketIdParamSchema }),
  ticketRoutingController.route,
);

ticketsRouter.get(
  '/:id/transitions',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_READ),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.getStatusTransitions,
);

ticketsRouter.get(
  '/:id/history',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_READ),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.getHistory,
);

ticketsRouter.post(
  '/:id/comments',
  authenticate,
  authorize(...ROLE_GROUPS.INTERNAL_COMMENTS),
  validateRequest({
    params: ticketIdParamSchema,
    body: createTicketCommentSchema,
  }),
  ticketCommentsController.create,
);

ticketsRouter.get(
  '/:id/comments',
  authenticate,
  authorize(...ROLE_GROUPS.INTERNAL_COMMENTS),
  validateRequest({ params: ticketIdParamSchema }),
  ticketCommentsController.list,
);

ticketsRouter.post(
  '/:id/attachments',
  authenticate,
  authorize(...ROLE_GROUPS.ATTACHMENT_MANAGE, UserRole.OMBUDSMAN),
  validateRequest({ params: ticketIdParamSchema }),
  upload.single('file'),
  ticketAttachmentsController.upload,
);

ticketsRouter.get(
  '/:id/attachments',
  authenticate,
  authorize(...ROLE_GROUPS.ATTACHMENT_READ),
  validateRequest({ params: ticketIdParamSchema }),
  ticketAttachmentsController.list,
);

ticketsRouter.delete(
  '/:id/attachments/:attachmentId',
  authenticate,
  authorize(...ROLE_GROUPS.ATTACHMENT_MANAGE),
  validateRequest({ params: ticketAttachmentParamsSchema }),
  ticketAttachmentsController.delete,
);

ticketsRouter.get(
  '/:id',
  authenticate,
  authorize(...ROLE_GROUPS.TICKET_READ),
  validateRequest({ params: ticketIdParamSchema }),
  ticketsController.findById,
);
