import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

import { logger } from './logger.js';
import { SENSITIVE_REDACT_PATHS } from './sensitive-redaction.js';

function resolveRequestId(req: IncomingMessage): string {
  const existingId = (req as IncomingMessage & { id?: string | number }).id;
  if (existingId !== undefined) {
    return String(existingId);
  }

  const header = req.headers['x-request-id'];
  if (typeof header === 'string' && header.trim().length > 0) {
    return header.trim();
  }

  return randomUUID();
}

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const requestId = resolveRequestId(req);
    (req as IncomingMessage & { id?: string }).id = requestId;
    res.setHeader('X-Request-Id', requestId);
    return requestId;
  },
  redact: {
    paths: [...SENSITIVE_REDACT_PATHS],
    censor: '[Redacted]',
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'durationMs',
  },
  customProps: (req) => {
    const request = req as IncomingMessage & {
      id?: string;
      user?: { id?: string; tenantId?: string };
    };

    return {
      requestId: request.id,
      userId: request.user?.id,
      tenantId: request.user?.tenantId,
    };
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
  customReceivedMessage: (req) => `Request started: ${req.method} ${req.url}`,
  customSuccessMessage: (req, res, responseTime) =>
    `Request completed: ${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`,
  customErrorMessage: (req, res, err) =>
    `Request failed: ${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
});
