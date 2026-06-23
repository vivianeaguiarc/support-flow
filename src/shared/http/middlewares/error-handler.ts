import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';
import { mapPrismaError } from '../../errors/prisma-error-mapper.js';
import { logger } from '../../logger/logger.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  const prismaError = mapPrismaError(err);

  if (prismaError) {
    res.status(prismaError.statusCode).json({
      statusCode: prismaError.statusCode,
      message: prismaError.message,
    });
    return;
  }

  logger.error({ err }, 'Unexpected error');

  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
  });
}
