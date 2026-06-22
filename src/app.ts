import express from 'express';

import { ticketsRouter } from './modules/tickets/routes/tickets.routes.js';
import { usersRouter } from './modules/users/routes/users.routes.js';
import { errorHandler } from './shared/http/middlewares/error-handler.js';
import { notFoundHandler } from './shared/http/middlewares/not-found-handler.js';
import { rateLimitMiddleware } from './shared/http/middlewares/rate-limit.js';
import { securityMiddleware } from './shared/http/middlewares/security.js';
import { healthRouter } from './shared/http/routes/health.routes.js';
import { httpLogger } from './shared/logger/http-logger.js';

export function createApp() {
  const app = express();

  app.use(httpLogger);
  app.use(...securityMiddleware);
  app.use(rateLimitMiddleware);
  app.use(express.json());

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/tickets', ticketsRouter);
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
