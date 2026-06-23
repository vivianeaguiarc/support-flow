import type { AppError } from './app-error.js';

export type ApiErrorResponse = {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  details?: unknown;
};

type BuildErrorResponseOptions = {
  includeDetails?: boolean;
  requestId?: string;
};

export function buildErrorResponse(
  err: AppError,
  options: BuildErrorResponseOptions = {},
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    statusCode: err.statusCode,
    error: err.error,
    message: err.message,
  };

  if (options.requestId) {
    response.requestId = options.requestId;
  }

  if (options.includeDetails && err.details !== undefined) {
    response.details = err.details;
  }

  return response;
}
