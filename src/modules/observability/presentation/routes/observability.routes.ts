import type { NextFunction, Request, Response } from 'express';

import { env } from '../../../../config/env.js';
import { metricsService } from '../../application/metrics.service.js';
import { observabilityService } from '../../application/observability.service.js';

export async function observabilityHealthHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const health = await observabilityService.getHealth();
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
}

export async function prometheusMetricsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  if (!env.METRICS_ENABLED) {
    res.status(404).json({
      error: {
        code: 'METRICS_DISABLED',
        message: 'Metrics collection is disabled',
      },
    });
    return;
  }

  const metrics = await metricsService.getPrometheusMetrics();
  res.setHeader('Content-Type', metricsService.getContentType());
  res.status(200).send(metrics);
}
