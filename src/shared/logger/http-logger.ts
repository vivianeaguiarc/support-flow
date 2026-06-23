import type { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

import { logger } from './logger.js';

export const httpLogger = pinoHttp({
  logger,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[Redacted]',
  },
  autoLogging: {
    ignore: (req: IncomingMessage) => {
      const url = req.url?.split('?')[0];
      return (
        url === '/health' || url === '/health/ready' || url === '/api/v1/health'
      );
    },
  },
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
});
