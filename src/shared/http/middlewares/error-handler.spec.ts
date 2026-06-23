import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '../../errors/app-error.js';
import { ForbiddenError } from '../../errors/http-errors.js';
import { errorHandler } from './error-handler.js';

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as Response & { statusCode: number; body: unknown };
}

describe('errorHandler', () => {
  it('should format AppError responses consistently', () => {
    const res = createMockResponse();
    const req = { id: 'req-1' } as Request;

    errorHandler(
      new AppError('Ticket not found', 404),
      req,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Ticket not found',
      requestId: 'req-1',
    });
  });

  it('should format specific HTTP errors', () => {
    const res = createMockResponse();
    const req = { id: 'req-2' } as Request;

    errorHandler(new ForbiddenError(), req, res, vi.fn() as NextFunction);

    expect(res.body).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden',
      requestId: 'req-2',
    });
  });

  it('should map Prisma unique constraint errors to 409', () => {
    const res = createMockResponse();
    const req = {} as Request;
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    );

    errorHandler(prismaError, req, res, vi.fn() as NextFunction);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'Resource already exists',
    });
  });

  it('should map Zod validation errors to 400 with details', () => {
    const res = createMockResponse();
    const req = {} as Request;
    const schema = z.object({ email: z.email() });

    try {
      schema.parse({ email: 'invalid' });
    } catch (error) {
      errorHandler(error as Error, req, res, vi.fn() as NextFunction);
    }

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      details: [{ path: 'email', message: expect.any(String) }],
    });
  });

  it('should return generic 500 without stack trace for unexpected errors', () => {
    const res = createMockResponse();
    const req = { id: 'req-3' } as Request;

    errorHandler(
      new Error('database exploded'),
      req,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
      requestId: 'req-3',
    });
    expect(res.body).not.toHaveProperty('stack');
  });
});
