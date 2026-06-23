import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { AppError } from './app-error.js';
import { mapPrismaError } from './prisma-error-mapper.js';

describe('mapPrismaError', () => {
  it('maps unique constraint violations to 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    );

    expect(mapPrismaError(error)).toEqual(
      new AppError('Resource already exists', 409),
    );
  });

  it('maps record not found to 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    expect(mapPrismaError(error)).toEqual(
      new AppError('Resource not found', 404),
    );
  });

  it('returns null for unknown errors', () => {
    expect(mapPrismaError(new Error('boom'))).toBeNull();
  });
});
