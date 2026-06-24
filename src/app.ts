import express from 'express';

import { env } from './config/env.js';
import { setupSwagger } from './config/setup-swagger.js';
import { httpMetricsMiddleware } from './modules/observability/presentation/middlewares/http-metrics.middleware.js';
import { createApiV1Router } from './routes/v1/index.js';
import { createApiV2Router } from './routes/v2/index.js';
import { registerEventHandlers } from './shared/events/register-event-handlers.js';
import { API_VERSION, apiVersionBasePath } from './shared/http/api-version.js';
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

  app.use(apiVersionBasePath(API_VERSION.V1), createApiV1Router());
  app.use(apiVersionBasePath(API_VERSION.V2), createApiV2Router());

  if (options.swagger) {
    setupSwagger(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
