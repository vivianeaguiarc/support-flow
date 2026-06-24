import { Router } from 'express';

import { authenticate } from '../../../../shared/http/middlewares/authenticate.js';
import { requirePermission } from '../../../../shared/http/middlewares/require-permission.js';
import { validateRequest } from '../../../../shared/http/middlewares/validate-request.js';
import { PermissionKey } from '../../../../shared/security/permissions.js';
import { analyticsQuerySchema } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import { reportsController } from '../controllers/reports.controller.js';

export const reportsRouter = Router();

const reportsAccess = [
  authenticate,
  requirePermission(PermissionKey.REPORTS_EXPORT),
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
