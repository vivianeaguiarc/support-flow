import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { getRequestId, requestContext } from '../../logger/request-context.js';
import { requestTracing } from './request-tracing.js';

function createMockResponse() {
  const headers = new Map<string, string>();

  return {
    setHeader: vi.fn((name: string, value: string) => {
      headers.set(name, value);
    }),
    getHeader: (name: string) => headers.get(name),
  } as unknown as Response;
}

describe('requestTracing', () => {
  it('generates a request id and exposes it through async context', () => {
    const req = {
      headers: {},
      method: 'GET',
      originalUrl: '/api/v1/tickets?page=1',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn((...args: unknown[]) => {
      if (args.length === 0) {
        expect(getRequestId(req)).toBe(req.id);
        expect(requestContext.getStore()?.requestId).toBe(req.id);
      }
    }) as NextFunction;

    requestTracing(req, res, next);

    expect(req.id).toBeDefined();
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalled();
  });

  it('reuses incoming x-request-id header', () => {
    const req = {
      headers: { 'x-request-id': 'client-req-42' },
      method: 'POST',
      originalUrl: '/api/v1/auth/login',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    requestTracing(req, res, next);

    expect(req.id).toBe('client-req-42');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'client-req-42');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      'client-req-42',
    );
  });

  it('uses x-correlation-id when provided separately from request id', () => {
    const req = {
      headers: {
        'x-request-id': 'client-req-42',
        'x-correlation-id': 'corr-99',
      },
      method: 'GET',
      originalUrl: '/api/v1/tickets',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn((...args: unknown[]) => {
      if (args.length === 0) {
        expect(requestContext.getStore()?.correlationId).toBe('corr-99');
        expect(requestContext.getStore()?.requestId).toBe('client-req-42');
      }
    }) as NextFunction;

    requestTracing(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'corr-99');
  });
});
