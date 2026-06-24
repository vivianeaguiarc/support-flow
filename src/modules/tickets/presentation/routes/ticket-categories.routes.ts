import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { ticketCategoriesController } from '../controllers/ticket-categories.controller.js';
import { listTicketCategoriesQuerySchema } from '../dtos/list-ticket-categories-query.dto.js';

export const ticketCategoriesRouter = Router();

ticketCategoriesRouter.get(
  '/',
  authenticate,
  authorize(...ROLE_GROUPS.CATEGORY_LIST),
  validateRequest({ query: listTicketCategoriesQuerySchema }),
  ticketCategoriesController.list,
);
