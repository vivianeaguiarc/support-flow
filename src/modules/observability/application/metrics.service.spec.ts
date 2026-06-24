import { beforeEach, describe, expect, it } from 'vitest';

import { metricsService } from './metrics.service.js';

describe('MetricsService', () => {
  beforeEach(() => {
    metricsService.resetForTests();
  });

  it('records HTTP requests and computes summary', () => {
    metricsService.recordHttpRequest(
      { method: 'GET', route: '/api/v1/health', statusCode: '200' },
      50,
    );
    metricsService.recordHttpRequest(
      { method: 'POST', route: '/api/v1/auth/login', statusCode: '401' },
      120,
    );

    const summary = metricsService.getHttpSummary();

    expect(summary.totalRequests).toBe(2);
    expect(summary.averageDurationMs).toBe(85);
    expect(summary.errorRate).toBe(0.5);
  });

  it('records job processing metrics', () => {
    metricsService.recordJobCompletion('email-queue', 200, 'completed');
    metricsService.recordJobCompletion('email-queue', 80, 'failed');

    const summary = metricsService.getJobSummary();

    expect(summary.processedTotal).toBe(2);
    expect(summary.averageProcessingMs).toBe(140);
  });

  it('exposes prometheus metrics text', async () => {
    metricsService.recordHttpRequest(
      { method: 'GET', route: '/health', statusCode: '200' },
      10,
    );

    const output = await metricsService.getPrometheusMetrics();

    expect(output).toContain('http_requests_total');
    expect(output).toContain('database_up');
  });
});
