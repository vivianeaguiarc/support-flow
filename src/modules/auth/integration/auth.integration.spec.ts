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

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));

    const storedToken = await integrationPrisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(response.body.refreshToken as string),
      },
    });

    expect(storedToken).toMatchObject({
      userId: fixtures.agentA.id,
      tenantId: fixtures.tenantA.id,
      revokedAt: null,
    });
    expect(storedToken?.tokenHash).not.toBe(response.body.refreshToken);
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

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
    expect(refreshResponse.body.refreshToken).not.toBe(
      initialTokens.refreshToken,
    );

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

    const api = authRequest(app, refreshResponse.body.accessToken as string);
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

    expect(logoutResponse.body).toEqual({
      message: 'Logged out successfully',
    });

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
