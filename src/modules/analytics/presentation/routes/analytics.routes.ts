import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { analyticsQuerySchema } from '../dtos/analytics-query.dto.js';

export const analyticsRouter = Router();

const analyticsAccess = [
  authenticate,
  authorize(...ROLE_GROUPS.ANALYTICS),
  validateRequest({ query: analyticsQuerySchema }),
] as const;

analyticsRouter.get(
  '/overview',
  ...analyticsAccess,
  analyticsController.overview,
);

analyticsRouter.get(
  '/tickets-by-status',
  ...analyticsAccess,
  analyticsController.ticketsByStatus,
);

analyticsRouter.get(
  '/tickets-by-priority',
  ...analyticsAccess,
  analyticsController.ticketsByPriority,
);

analyticsRouter.get('/sla', ...analyticsAccess, analyticsController.sla);

analyticsRouter.get(
  '/agents-performance',
  ...analyticsAccess,
  analyticsController.agentsPerformance,
);

const csatAccess = [
  authenticate,
  authorize(...ROLE_GROUPS.CSAT_ANALYTICS),
  validateRequest({ query: analyticsQuerySchema }),
] as const;

analyticsRouter.get('/csat', ...csatAccess, analyticsController.csat);
