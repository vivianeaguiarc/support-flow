import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../errors/app-error.js';

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new AppError('Route not found', 404));
}
