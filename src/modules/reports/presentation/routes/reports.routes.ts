import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { authorize } from '../../../../shared/http/middlewares/authorize.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { ROLE_GROUPS } from '../../../../shared/security/rbac.js';
import { analyticsQuerySchema } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

const reportsAccess = [
  authenticate,
  authorize(...ROLE_GROUPS.ANALYTICS),
  validateRequest({ query: analyticsQuerySchema }),
] as const;

reportsRouter.get(
  '/tickets.csv',
  ...reportsAccess,
  reportsController.exportTickets,
);

reportsRouter.get(
  '/agents-performance.csv',
  ...reportsAccess,
  reportsController.exportAgentsPerformance,
);

reportsRouter.get('/sla.csv', ...reportsAccess, reportsController.exportSla);
