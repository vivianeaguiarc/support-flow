import express from 'express';

import { env } from './config/env.js';
import { setupSwagger } from './config/setup-swagger.js';
import { analyticsRouter } from './modules/analytics/presentation/routes/analytics.routes.js';
import { apiKeysRouter } from './modules/api-keys/presentation/routes/api-keys.routes.js';
import { authRouter } from './modules/auth/routes/auth.routes.js';
import { automationRouter } from './modules/automation/presentation/routes/automation.routes.js';
import { customersRouter } from './modules/customers/routes/customers.routes.js';
import { adminRouter } from './modules/email/presentation/routes/admin-notifications.routes.js';
import { knowledgeRouter } from './modules/knowledge-base/presentation/routes/knowledge.routes.js';
import { notificationsRouter } from './modules/notifications/presentation/routes/notifications.routes.js';
import { httpMetricsMiddleware } from './modules/observability/presentation/middlewares/http-metrics.middleware.js';
import { prometheusMetricsHandler } from './modules/observability/presentation/routes/observability.routes.js';
import { reportsRouter } from './modules/reports/presentation/routes/reports.routes.js';
import { metricsRouter } from './modules/tickets/presentation/routes/metrics.routes.js';
import { ticketCategoriesRouter } from './modules/tickets/presentation/routes/ticket-categories.routes.js';
import { ticketsRouter } from './modules/tickets/presentation/routes/tickets.routes.js';
import { usersRouter } from './modules/users/routes/users.routes.js';
import { webhooksRouter } from './modules/webhooks/presentation/routes/webhooks.routes.js';
import { registerEventHandlers } from './shared/events/register-event-handlers.js';
import { errorHandler } from './shared/http/middlewares/error-handler.js';
import { notFoundHandler } from './shared/http/middlewares/not-found-handler.js';
import { rateLimitMiddleware } from './shared/http/middlewares/rate-limit.js';
import { requestTracing } from './shared/http/middlewares/request-tracing.js';
import { securityMiddleware } from './shared/http/middlewares/security.js';
import { healthRouter } from './shared/http/routes/health.routes.js';
import { httpLogger } from './shared/logger/http-logger.js';

type CreateAppOptions = {
  swagger?: boolean;
};

export function createApp(options: CreateAppOptions = {}) {
  registerEventHandlers();

  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use('/health', healthRouter);

  app.use(requestTracing);
  app.use(httpMetricsMiddleware);
  app.use(httpLogger);
  app.use(...securityMiddleware);
  if (env.RATE_LIMIT_ENABLED) {
    app.use(rateLimitMiddleware);
  }
  app.use(express.json({ limit: '1mb' }));

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.get('/metrics', prometheusMetricsHandler);
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/customers', customersRouter);
  apiRouter.use('/ticket-categories', ticketCategoriesRouter);
  apiRouter.use('/tickets', ticketsRouter);
  apiRouter.use('/metrics', metricsRouter);
  apiRouter.use('/analytics', analyticsRouter);
  apiRouter.use('/automation', automationRouter);
  apiRouter.use('/api-keys', apiKeysRouter);
  apiRouter.use('/webhooks', webhooksRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/notifications', notificationsRouter);
  apiRouter.use('/knowledge', knowledgeRouter);
  apiRouter.use('/admin', adminRouter);
  app.use('/api/v1', apiRouter);

  if (options.swagger) {
    setupSwagger(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
