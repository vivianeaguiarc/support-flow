import type { Response } from 'express';

import type { AppError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ValidationIssue } from '../../errors/http-errors.js';
import type { PaginationMeta } from '../pagination/pagination.js';

export { type PaginationMeta } from '../pagination/pagination.js';

export const DEFAULT_SUCCESS_MESSAGE = 'Operation completed successfully';

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiPaginatedSuccessResponse<T> = {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message: string;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details: unknown[];
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
  requestId?: string;
};

type SendSuccessOptions = {
  status?: number;
  message?: string;
};

type BuildErrorResponseOptions = {
  includeDetails?: boolean;
  requestId?: string;
};

export function buildSuccessResponse<T>(
  data: T,
  message = DEFAULT_SUCCESS_MESSAGE,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options: SendSuccessOptions = {},
): void {
  res
    .status(options.status ?? 200)
    .json(buildSuccessResponse(data, options.message));
}

export function buildPaginatedSuccessResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message = DEFAULT_SUCCESS_MESSAGE,
): ApiPaginatedSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
    message,
  };
}

export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  options: SendSuccessOptions = {},
): void {
  res
    .status(options.status ?? 200)
    .json(buildPaginatedSuccessResponse(data, meta, options.message));
}

export function normalizeErrorDetails(details: unknown): unknown[] {
  if (details === undefined) {
    return [];
  }

  if (Array.isArray(details)) {
    return details;
  }

  return [details];
}

export function buildErrorResponse(
  err: AppError,
  options: BuildErrorResponseOptions = {},
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      details: options.includeDetails
        ? normalizeErrorDetails(err.details)
        : normalizeValidationDetails(err.details),
    },
  };

  if (options.requestId) {
    response.requestId = options.requestId;
  }

  return response;
}

function normalizeValidationDetails(details: unknown): unknown[] {
  if (details === undefined) {
    return [];
  }

  if (Array.isArray(details)) {
    return details;
  }

  return [];
}

export function buildInternalErrorResponse(
  message = 'Internal server error',
  options: BuildErrorResponseOptions & { details?: unknown } = {},
): ApiErrorResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      details:
        options.includeDetails && options.details !== undefined
          ? normalizeErrorDetails(options.details)
          : [],
    },
  };

  if (options.requestId) {
    response.requestId = options.requestId;
  }

  return response;
}

export type { ValidationIssue };
