import { Router } from 'express';

import { env } from '../../../config/env.js';
import { prisma } from '../../database/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'supportflow-backend',
    environment: env.NODE_ENV,
  });
});

healthRouter.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ready',
      service: 'supportflow-backend',
      checks: {
        database: 'up',
      },
    });
  } catch {
    res.status(503).json({
      status: 'not_ready',
      service: 'supportflow-backend',
      checks: {
        database: 'down',
      },
    });
  }
});
