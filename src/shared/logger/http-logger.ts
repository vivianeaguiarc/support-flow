import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { context, trace } from '@opentelemetry/api';
import { pinoHttp } from 'pino-http';

import { logger } from './logger.js';
import { getCorrelationId, getRequestContext } from './request-context.js';
import { SENSITIVE_REDACT_PATHS } from './sensitive-redaction.js';

function getTraceLogFields(): Record<string, string> {
  const span = trace.getSpan(context.active());
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  if (!spanContext.traceId) {
    return {};
  }

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

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
    const requestContext = getRequestContext();

    return {
      requestId: request.id,
      correlationId: requestContext?.correlationId ?? getCorrelationId(request),
      ...getTraceLogFields(),
      userId: request.user?.id,
      tenantId: request.user?.tenantId,
    };
  },
  autoLogging: {
    ignore: (req: IncomingMessage) => {
      const url = req.url?.split('?')[0];
      return (
        url === '/health' ||
        url === '/health/ready' ||
        url === '/health/observability' ||
        url === '/api/v1/health' ||
        url === '/api/v1/health/observability' ||
        url === '/api/v1/metrics'
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
