import { Prisma } from '@prisma/client';

import { AppError } from './app-error.js';

export function mapPrismaError(error: unknown): AppError | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  switch (error.code) {
    case 'P2002':
      return new AppError('Resource already exists', 409);
    case 'P2025':
      return new AppError('Resource not found', 404);
    case 'P2003':
      return new AppError('Invalid reference', 400);
    default:
      return null;
  }
}
