import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

import { requestContext } from '../../logger/request-context.js';

const REQUEST_ID_HEADER = 'x-request-id';
const RESPONSE_REQUEST_ID_HEADER = 'X-Request-Id';

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

  req.id = requestId;
  res.setHeader(RESPONSE_REQUEST_ID_HEADER, requestId);

  requestContext.run(
    {
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
    },
    () => next(),
  );
}
