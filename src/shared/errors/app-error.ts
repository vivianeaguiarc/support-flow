import { ErrorCode } from './error-codes.js';
import { resolveHttpErrorLabel } from './http-error-labels.js';

function resolveDefaultErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCode.UNIQUE_CONSTRAINT_VIOLATION;
    default:
      return statusCode >= 500
        ? ErrorCode.INTERNAL_SERVER_ERROR
        : ErrorCode.BAD_REQUEST;
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly error: string;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    error?: string,
    details?: unknown,
    code?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.error = error ?? resolveHttpErrorLabel(statusCode);
    this.code = code ?? resolveDefaultErrorCode(statusCode);
    this.details = details;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
