import { describe, expect, it } from 'vitest';

import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';
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
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
  });

  it('should create specific error classes with correct status codes', () => {
    expect(new BadRequestError('Invalid input')).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      code: ErrorCode.BAD_REQUEST,
    });
    expect(new UnauthorizedError('Token not provided')).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      code: ErrorCode.UNAUTHORIZED,
    });
    expect(new ForbiddenError()).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      code: ErrorCode.FORBIDDEN,
    });
    expect(new NotFoundError('Ticket not found')).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Ticket not found',
      code: ErrorCode.RESOURCE_NOT_FOUND,
    });
    expect(new ConflictError('Email already in use')).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      code: ErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
    });
  });

  it('should include validation details', () => {
    const error = new ValidationError('email: Invalid email format', [
      { path: 'email', message: 'Invalid email format' },
    ]);

    expect(error.details).toEqual([
      { path: 'email', message: 'Invalid email format' },
    ]);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });
});

describe('buildErrorResponse', () => {
  it('should build the standard API error payload', () => {
    const response = buildErrorResponse(new NotFoundError('Ticket not found'), {
      requestId: 'req-123',
      includeDetails: true,
    });

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Ticket not found',
        details: [],
      },
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

    expect(response.error.details).toEqual([
      { path: 'email', message: 'Invalid email format' },
    ]);
  });
});
