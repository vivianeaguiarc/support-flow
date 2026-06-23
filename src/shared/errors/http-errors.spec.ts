import { describe, expect, it } from 'vitest';

import { AppError } from './app-error.js';
import { buildErrorResponse } from './error-response.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './http-errors.js';

describe('http-errors', () => {
  it('should keep AppError backward compatible with error labels', () => {
    const error = new AppError('Ticket not found', 404);

    expect(error).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Ticket not found',
      isOperational: true,
    });
  });

  it('should create specific error classes with correct status codes', () => {
    expect(new BadRequestError('Invalid input')).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(new UnauthorizedError('Token not provided')).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
    });
    expect(new ForbiddenError()).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
    });
    expect(new NotFoundError('Ticket not found')).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Ticket not found',
    });
    expect(new ConflictError('Email already in use')).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
    });
  });

  it('should include validation details', () => {
    const error = new ValidationError('email: Invalid email format', [
      { path: 'email', message: 'Invalid email format' },
    ]);

    expect(error.details).toEqual([
      { path: 'email', message: 'Invalid email format' },
    ]);
  });
});

describe('buildErrorResponse', () => {
  it('should build the standard API error payload', () => {
    const response = buildErrorResponse(new NotFoundError('Ticket not found'), {
      requestId: 'req-123',
      includeDetails: true,
    });

    expect(response).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Ticket not found',
      requestId: 'req-123',
    });
  });

  it('should include details outside production only when requested', () => {
    const response = buildErrorResponse(
      new ValidationError('email: Invalid email format', [
        { path: 'email', message: 'Invalid email format' },
      ]),
      { includeDetails: true },
    );

    expect(response.details).toEqual([
      { path: 'email', message: 'Invalid email format' },
    ]);
  });
});
