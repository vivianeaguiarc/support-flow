import express from 'express';

import { errorHandler } from './shared/http/middlewares/error-handler.js';
import { notFoundHandler } from './shared/http/middlewares/not-found-handler.js';
import { healthRouter } from './shared/http/routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
