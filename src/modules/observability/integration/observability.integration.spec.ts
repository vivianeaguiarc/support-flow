import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
} from '../../../test/integration/database.js';

describe.sequential('Observability endpoints', () => {
  let app: Express;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('GET /api/v1/health/observability returns observability health', async () => {
    const response = await request(app)
      .get('/api/v1/health/observability')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      checks: {
        database: 'up',
        redis: 'skipped',
      },
      openTelemetry: {
        enabled: false,
      },
      metrics: {
        enabled: true,
      },
    });
    expect(response.body.http).toMatchObject({
      totalRequests: expect.any(Number),
      averageDurationMs: expect.any(Number),
      errorRate: expect.any(Number),
    });
  });

  it('GET /api/v1/metrics returns prometheus text', async () => {
    await request(app).get('/api/v1/health').expect(200);

    const response = await request(app).get('/api/v1/metrics').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('http_requests_total');
  });

  it('propagates correlation id headers', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('X-Correlation-Id', 'corr-integration-1')
      .set('X-Request-Id', 'req-integration-1')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe('corr-integration-1');
    expect(response.headers['x-request-id']).toBe('req-integration-1');
  });
});
