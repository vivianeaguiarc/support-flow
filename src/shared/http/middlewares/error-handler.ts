import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { env } from '../../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { buildErrorResponse } from '../../errors/error-response.js';
import { ValidationError } from '../../errors/http-errors.js';
import { mapPrismaError } from '../../errors/prisma-error-mapper.js';
import { logger } from '../../logger/logger.js';
import { getRequestId } from '../../logger/request-context.js';

function formatZodIssues(error: ZodError): ValidationError {
  const details = error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'request',
    message: issue.message,
  }));

  const message = details
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join('; ');

  return new ValidationError(message, details);
}

function resolveOperationalError(err: Error): AppError | null {
  if (err instanceof AppError) {
    return err;
  }

  if (err instanceof ZodError) {
    return formatZodIssues(err);
  }

  return mapPrismaError(err);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const operationalError = resolveOperationalError(err);
  const includeDetails = env.NODE_ENV !== 'production';
  const requestId = getRequestId(req);

  if (operationalError) {
    if (operationalError.statusCode >= 500) {
      logger.error({ err, requestId }, operationalError.message);
    } else if (operationalError.statusCode >= 400) {
      logger.warn({ err, requestId }, operationalError.message);
    }

    res
      .status(operationalError.statusCode)
      .json(
        buildErrorResponse(operationalError, { includeDetails, requestId }),
      );
    return;
  }

  logger.error(
    {
      requestId,
      error: { name: err.name, message: err.message },
      ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
    'Unexpected error',
  );

  res.status(500).json({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'Internal server error',
    ...(requestId ? { requestId } : {}),
    ...(includeDetails && err.message ? { details: err.message } : {}),
  });
}
