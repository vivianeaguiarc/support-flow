import { describe, expect, it } from 'vitest';

import { AppError } from '../../errors/app-error.js';
import { ErrorCode } from '../../errors/error-codes.js';
import { NotFoundError, ValidationError } from '../../errors/http-errors.js';
import {
  buildErrorResponse,
  buildInternalErrorResponse,
  buildSuccessResponse,
  sendSuccess,
} from './api-response.js';

describe('api-response', () => {
  it('should build standardized success payload', () => {
    expect(buildSuccessResponse({ id: '1' }, 'Created')).toEqual({
      success: true,
      data: { id: '1' },
      message: 'Created',
    });
  });

  it('should build standardized error payload', () => {
    const response = buildErrorResponse(new NotFoundError('Ticket not found'), {
      requestId: 'req-1',
      includeDetails: true,
    });

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message: 'Ticket not found',
        details: [],
      },
      requestId: 'req-1',
    });
  });

  it('should include validation details as array', () => {
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

  it('should build internal error payload', () => {
    expect(
      buildInternalErrorResponse('Internal server error', {
        requestId: 'req-2',
      }),
    ).toEqual({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        details: [],
      },
      requestId: 'req-2',
    });
  });

  it('should send success through express response', () => {
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

    sendSuccess(res as never, { ok: true }, { status: 201 });

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { ok: true },
      message: 'Operation completed successfully',
    });
  });

  it('should map generic AppError status to default error code', () => {
    const response = buildErrorResponse(new AppError('Ticket not found', 404));

    expect(response.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });
});
