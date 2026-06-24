import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, true, 'Bad Request', details, ErrorCode.BAD_REQUEST);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(message, 401, true, 'Unauthorized', details, ErrorCode.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(message, 403, true, 'Forbidden', details, ErrorCode.FORBIDDEN);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: unknown) {
    super(
      message,
      404,
      true,
      'Not Found',
      details,
      ErrorCode.RESOURCE_NOT_FOUND,
    );
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      409,
      true,
      'Conflict',
      details,
      ErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
    );
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(
      message,
      500,
      true,
      'Internal Server Error',
      details,
      ErrorCode.INTERNAL_SERVER_ERROR,
    );
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export type ValidationIssue = {
  path: string;
  message: string;
};

export class ValidationError extends AppError {
  constructor(message: string, details?: ValidationIssue[]) {
    super(
      message,
      400,
      true,
      'Bad Request',
      details,
      ErrorCode.VALIDATION_ERROR,
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
