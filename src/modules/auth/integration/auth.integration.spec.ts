import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { hashRefreshToken } from '../../../shared/security/token-hash.js';
import {
  disconnectTestDatabase,
  integrationPrisma,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  loginWithTokens,
  unwrapApiData,
} from '../../../test/integration/http-client.js';

describe.sequential('Auth refresh token integration', () => {
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

  it('should login and return access and refresh tokens', async () => {
    const fixtures = await seedIntegrationFixtures();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: fixtures.agentA.email,
        password: fixtures.password,
      })
      .expect(200);

    const tokens = unwrapApiData(response.body);
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));

    const storedToken = await integrationPrisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(tokens.refreshToken),
      },
    });

    expect(storedToken).toMatchObject({
      userId: fixtures.agentA.id,
      tenantId: fixtures.tenantA.id,
      revokedAt: null,
    });
    expect(storedToken?.tokenHash).not.toBe(tokens.refreshToken);
  });

  it('should refresh tokens and rotate the refresh token', async () => {
    const fixtures = await seedIntegrationFixtures();
    const initialTokens = await loginWithTokens(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken })
      .expect(200);

    const refreshedTokens = unwrapApiData(refreshResponse.body);
    expect(refreshedTokens.accessToken).toEqual(expect.any(String));
    expect(refreshedTokens.refreshToken).toEqual(expect.any(String));
    expect(refreshedTokens.refreshToken).not.toBe(initialTokens.refreshToken);

    const oldToken = await integrationPrisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(initialTokens.refreshToken),
      },
    });
    expect(oldToken?.revokedAt).not.toBeNull();

    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: initialTokens.refreshToken })
      .expect(401);

    const api = authRequest(app, refreshedTokens.accessToken);
    await api.get('/api/v1/tickets').expect(200);
  });

  it('should logout and revoke the refresh token', async () => {
    const fixtures = await seedIntegrationFixtures();
    const tokens = await loginWithTokens(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: tokens.refreshToken })
      .expect(200);

    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toBe('Logged out successfully');

    const storedToken = await integrationPrisma.refreshToken.findUnique({
      where: { tokenHash: hashRefreshToken(tokens.refreshToken) },
    });
    expect(storedToken?.revokedAt).not.toBeNull();

    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
  });

  it('should reject refresh with invalid token', async () => {
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);
  });
});
