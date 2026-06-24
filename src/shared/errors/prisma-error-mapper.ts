import { Prisma } from '@prisma/client';

import type { AppError } from './app-error.js';
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from './http-errors.js';

export function mapPrismaError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case 'P2002':
      return new ConflictError('Resource already exists');
    case 'P2025':
      return new NotFoundError('Resource not found');
    case 'P2003':
      return new BadRequestError('Invalid reference');
    default:
      return new InternalServerError('Database operation failed');
  }
}
