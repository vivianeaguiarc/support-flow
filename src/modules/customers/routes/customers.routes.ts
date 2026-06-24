import { Router } from 'express';

import { authenticate } from '../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../shared/security/rbac.js';
import { customersController } from '../controllers/customers.controller.js';
import { listCustomersQuerySchema } from '../dtos/list-customers-query.dto.js';

export const customersRouter = Router();

customersRouter.get(
  '/',
  authenticate,
  authorize(...ROLE_GROUPS.CUSTOMER_LIST),
  validateRequest({ query: listCustomersQuerySchema }),
  customersController.list,
);
