import { Router } from 'express';

import { env } from '../../config/env.js';

export const v2HealthRouter = Router();

v2HealthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'supportflow-backend',
    apiVersion: 'v2',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
