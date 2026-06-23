import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapPrismaError } from './prisma-error-mapper.js';

describe('mapPrismaError', () => {
  it('maps unique constraint violations to 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    );

    expect(mapPrismaError(error)).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'Resource already exists',
    });
  });

  it('maps record not found to 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    expect(mapPrismaError(error)).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Resource not found',
    });
  });

  it('maps invalid reference to 400', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Invalid reference',
      {
        code: 'P2003',
        clientVersion: 'test',
      },
    );

    expect(mapPrismaError(error)).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid reference',
    });
  });

  it('returns null for unknown errors', () => {
    expect(mapPrismaError(new Error('boom'))).toBeNull();
  });
});
