import { Router } from 'express';

import { analyticsRouter } from '../../modules/analytics/presentation/routes/analytics.routes.js';
import { apiKeysRouter } from '../../modules/api-keys/presentation/routes/api-keys.routes.js';
import { authRouter } from '../../modules/auth/routes/auth.routes.js';
import { automationRouter } from '../../modules/automation/presentation/routes/automation.routes.js';
import { customersRouter } from '../../modules/customers/routes/customers.routes.js';
import { adminRouter } from '../../modules/email/presentation/routes/admin-notifications.routes.js';
import { knowledgeRouter } from '../../modules/knowledge-base/presentation/routes/knowledge.routes.js';
import { notificationsRouter } from '../../modules/notifications/presentation/routes/notifications.routes.js';
import { prometheusMetricsHandler } from '../../modules/observability/presentation/routes/observability.routes.js';
import { reportsRouter } from '../../modules/reports/presentation/routes/reports.routes.js';
import { slaPoliciesRouter } from '../../modules/sla-policies/presentation/routes/sla-policies.routes.js';
import { metricsRouter } from '../../modules/tickets/presentation/routes/metrics.routes.js';
import { ticketCategoriesRouter } from '../../modules/tickets/presentation/routes/ticket-categories.routes.js';
import { ticketsRouter } from '../../modules/tickets/presentation/routes/tickets.routes.js';
import { usersRouter } from '../../modules/users/routes/users.routes.js';
import { webhooksRouter } from '../../modules/webhooks/presentation/routes/webhooks.routes.js';
import { API_VERSION } from '../../shared/http/api-version.js';
import { attachApiVersion } from '../../shared/http/middlewares/attach-api-version.js';
import { resolveTenantContext } from '../../shared/http/middlewares/tenant-scope.middleware.js';
import { healthRouter } from '../../shared/http/routes/health.routes.js';

export function createApiV1Router(): Router {
  const router = Router();

  router.use(attachApiVersion(API_VERSION.V1));
  router.use(resolveTenantContext);
  router.use('/health', healthRouter);
  router.get('/metrics', prometheusMetricsHandler);
  router.use('/auth', authRouter);
  router.use('/users', usersRouter);
  router.use('/customers', customersRouter);
  router.use('/ticket-categories', ticketCategoriesRouter);
  router.use('/sla-policies', slaPoliciesRouter);
  router.use('/tickets', ticketsRouter);
  router.use('/metrics', metricsRouter);
  router.use('/analytics', analyticsRouter);
  router.use('/automation', automationRouter);
  router.use('/api-keys', apiKeysRouter);
  router.use('/webhooks', webhooksRouter);
  router.use('/reports', reportsRouter);
  router.use('/notifications', notificationsRouter);
  router.use('/knowledge', knowledgeRouter);
  router.use('/admin', adminRouter);

  return router;
}
