import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { API_VERSION, apiVersionBasePath } from './api-version.js';

describe('API versioning', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it('exposes v1 health with version header', async () => {
    const response = await request(app)
      .get(`${apiVersionBasePath(API_VERSION.V1)}/health`)
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v1');
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'supportflow-backend',
    });
  });

  it('exposes v2 health with apiVersion in payload', async () => {
    const response = await request(app)
      .get(`${apiVersionBasePath(API_VERSION.V2)}/health`)
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v2');
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'supportflow-backend',
      apiVersion: 'v2',
    });
  });

  it('returns 404 for unsupported API version', async () => {
    const response = await request(app).get('/api/v3/health').expect(404);

    expect(response.body.error.message).toContain('Route not found');
  });

  it('returns 401 for protected v2 route without authentication', async () => {
    await request(app)
      .get(`${apiVersionBasePath(API_VERSION.V2)}/tickets`)
      .expect(401);
  });

  it('preserves root health outside versioned API', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.headers['x-api-version']).toBeUndefined();
  });
});
