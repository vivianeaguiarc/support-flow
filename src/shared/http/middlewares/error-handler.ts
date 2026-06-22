import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';

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

  console.error(err);

  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
  });
}
