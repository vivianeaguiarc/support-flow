import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { ErrorCode } from './error-codes.js';
import { mapPrismaError } from './prisma-error-mapper.js';

describe('mapPrismaError', () => {
  it('maps unique constraint violations to 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    );

    expect(mapPrismaError(error)).toMatchObject({
      statusCode: 409,
      code: ErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
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
      code: ErrorCode.RESOURCE_NOT_FOUND,
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
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid reference',
    });
  });

  it('maps unknown prisma errors to internal server error', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unknown', {
      code: 'P9999',
      clientVersion: 'test',
    });

    expect(mapPrismaError(error)).toMatchObject({
      statusCode: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
    });
  });

  it('returns null for non-prisma errors', () => {
    expect(mapPrismaError(new Error('boom'))).toBeNull();
  });
});
