import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { setupSwagger } from './setup-swagger.js';

function buildApp() {
  const app = express();
  setupSwagger(app);
  return app;
}

describe('setupSwagger', () => {
  it('serves the full v1 spec at /api/docs', async () => {
    const app = buildApp();

    const init = await request(app).get('/api/docs/swagger-ui-init.js');
    expect(init.status).toBe(200);
    expect(init.text).toContain('SupportFlow API v1');
    expect(init.text).toContain('/auth/login');

    const json = await request(app).get('/api/docs.json');
    expect(json.status).toBe(200);
    expect(json.body.info.title).toBe('SupportFlow API v1');
    expect(Object.keys(json.body.paths).length).toBeGreaterThan(2);
  });

  it('serves the v2 spec at /api/docs/v2 without leaking v1 routes', async () => {
    const app = buildApp();

    const init = await request(app).get('/api/docs/v2/swagger-ui-init.js');
    expect(init.status).toBe(200);
    expect(init.text).toContain('SupportFlow API v2');

    const json = await request(app).get('/api/docs/v2.json');
    expect(json.status).toBe(200);
    expect(json.body.info.title).toBe('SupportFlow API v2');

    const v2Paths = Object.keys(json.body.paths);
    expect(v2Paths).toContain('/tickets');
    expect(v2Paths).not.toContain('/auth/login');
    expect(v2Paths).not.toContain('/users');
  });
});
