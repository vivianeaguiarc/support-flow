import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  login,
  unwrapApiData,
} from '../../../test/integration/http-client.js';

describe.sequential('GET /auth/me integration', () => {
  let app: Express;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('returns the authenticated user with a valid token', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.agentA.email, fixtures.password);

    const response = await authRequest(app, token)
      .get('/api/v1/auth/me')
      .expect(200);

    expect(response.body.success).toBe(true);

    const data = unwrapApiData(response.body) as Record<string, unknown>;
    expect(data).toMatchObject({
      id: fixtures.agentA.id,
      name: fixtures.agentA.name,
      email: fixtures.agentA.email,
      role: fixtures.agentA.role,
      tenantId: fixtures.agentA.tenantId,
    });
    expect(data.createdAt).toEqual(expect.any(String));
    expect(data.updatedAt).toEqual(expect.any(String));
  });

  it('does not expose sensitive fields', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.agentA.email, fixtures.password);

    const response = await authRequest(app, token)
      .get('/api/v1/auth/me')
      .expect(200);

    const data = unwrapApiData(response.body) as Record<string, unknown>;
    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('passwordHash');
    expect(data).not.toHaveProperty('failedLoginAttempts');
    expect(data).not.toHaveProperty('lockedUntil');
  });

  it('returns 401 when no token is provided', async () => {
    await request(app).get('/api/v1/auth/me').expect(401);
  });

  it('returns 401 when the token is invalid', async () => {
    await authRequest(app, 'not-a-real-token')
      .get('/api/v1/auth/me')
      .expect(401);
  });
});
