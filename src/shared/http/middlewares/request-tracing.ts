import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { requestContext } from '../../logger/request-context.js';

const REQUEST_ID_HEADER = 'x-request-id';
const CORRELATION_ID_HEADER = 'x-correlation-id';
const RESPONSE_REQUEST_ID_HEADER = 'X-Request-Id';
const RESPONSE_CORRELATION_ID_HEADER = 'X-Correlation-Id';

function resolveIncomingRequestId(
  header: string | string[] | undefined,
): string | undefined {
  if (typeof header === 'string') {
    const trimmed = header.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(header) && header.length > 0) {
    const trimmed = header[0]?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

export function requestTracing(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId =
    resolveIncomingRequestId(req.headers[REQUEST_ID_HEADER]) ?? randomUUID();
  const correlationId =
    resolveIncomingRequestId(req.headers[CORRELATION_ID_HEADER]) ?? requestId;

  req.id = requestId;
  res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);
  res.setHeader(RESPONSE_CORRELATION_ID_HEADER, correlationId);

  requestContext.run(
    {
      requestId,
      correlationId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
    },
    () => next(),
  );
}
