import type { NextFunction, Request, Response } from 'express';

import { metricsService } from '../../application/metrics.service.js';

function normalizeRoute(req: Request): string {
  if (req.route?.path) {
    const base = req.baseUrl === '/' ? '' : req.baseUrl;
    return `${base}${req.route.path}`;
  }

  return req.path || req.originalUrl.split('?')[0] || 'unknown';
}

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!metricsService.isEnabled()) {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    metricsService.recordHttpRequest(
      {
        method: req.method,
        route: normalizeRoute(req),
        statusCode: String(res.statusCode),
      },
      durationMs,
    );
  });

  next();
}
