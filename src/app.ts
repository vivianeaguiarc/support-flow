import express from 'express';

import { setupSwagger } from './config/setup-swagger.js';
import { authRouter } from './modules/auth/routes/auth.routes.js';
import { notificationsRouter } from './modules/notifications/presentation/routes/notifications.routes.js';
import { ticketsRouter } from './modules/tickets/presentation/routes/tickets.routes.js';
import { usersRouter } from './modules/users/routes/users.routes.js';
import { errorHandler } from './shared/http/middlewares/error-handler.js';
import { notFoundHandler } from './shared/http/middlewares/not-found-handler.js';
import { rateLimitMiddleware } from './shared/http/middlewares/rate-limit.js';
import { securityMiddleware } from './shared/http/middlewares/security.js';
import { healthRouter } from './shared/http/routes/health.routes.js';
import { httpLogger } from './shared/logger/http-logger.js';

type CreateAppOptions = {
  swagger?: boolean;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(httpLogger);
  app.use(...securityMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json());

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/tickets', ticketsRouter);
  apiRouter.use('/notifications', notificationsRouter);
  app.use('/api/v1', apiRouter);

  if (options.swagger) {
    setupSwagger(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
