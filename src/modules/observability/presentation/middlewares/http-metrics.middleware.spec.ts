import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { metricsService } from '../../application/metrics.service.js';
import { httpMetricsMiddleware } from './http-metrics.middleware.js';

function createMockResponse() {
  const listeners = new Map<string, Array<() => void>>();

  return {
    statusCode: 200,
    on: vi.fn((event: string, listener: () => void) => {
      const handlers = listeners.get(event) ?? [];
      handlers.push(listener);
      listeners.set(event, handlers);
    }),
    emitFinish: () => {
      for (const listener of listeners.get('finish') ?? []) {
        listener();
      }
    },
  } as unknown as Response & { emitFinish: () => void };
}

describe('httpMetricsMiddleware', () => {
  it('records metrics when the response finishes', () => {
    const recordSpy = vi.spyOn(metricsService, 'recordHttpRequest');
    const req = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      path: '/api/v1/health',
      route: { path: '/' },
      baseUrl: '/api/v1/health',
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    httpMetricsMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    res.emitFinish();

    expect(recordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        statusCode: '200',
      }),
      expect.any(Number),
    );

    recordSpy.mockRestore();
  });
});
