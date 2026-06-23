import { resolveHttpErrorLabel } from './http-error-labels.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly error: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    error?: string,
    details?: unknown,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.error = error ?? resolveHttpErrorLabel(statusCode);
    this.details = details;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
