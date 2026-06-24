import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import { TENANT_ID_HEADER } from '../../../shared/tenant/tenant-headers.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
  getApiErrorMessage,
  login,
} from '../../../test/integration/http-client.js';

describe.sequential('API security hardening', () => {
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

  it('locks account after repeated invalid login attempts', async () => {
    const fixtures = await seedIntegrationFixtures();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: fixtures.agentA.email,
          password: 'wrong-password',
        })
        .expect(401);
    }

    const lockedResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: fixtures.agentA.email,
        password: 'wrong-password',
      })
      .expect(423);

    expect(getApiErrorMessage(lockedResponse.body)).toContain(
      'Account temporarily locked',
    );

    const audits = await prisma.securityAuditLog.findMany({
      where: {
        email: fixtures.agentA.email,
        event: 'LOGIN_FAILED',
      },
    });

    expect(audits.length).toBeGreaterThanOrEqual(2);
  }, 10_000);

  it('records security audit when access is forbidden by role', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken).get('/api/v1/users').expect(403);

    const audits = await prisma.securityAuditLog.findMany({
      where: {
        event: 'ACCESS_DENIED',
        actorId: fixtures.agentA.id,
      },
    });

    expect(audits).toHaveLength(1);
  });

  it('blocks cross-tenant ticket read', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const created = await authRequest(app, agentToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Security ticket',
        description: 'Cross tenant validation ticket',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    await authRequest(app, agentBToken)
      .get(`/api/v1/tickets/${created.body.data.id}`)
      .expect(403);
  });

  it('rejects payloads with unknown fields', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const response = await authRequest(app, agentToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Invalid payload ticket',
        description: 'Payload includes unknown property',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
        injected: true,
      })
      .expect(400);

    expect(getApiErrorMessage(response.body)).toContain('Unrecognized key');
  });

  it('sanitizes HTML from ticket descriptions', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const response = await authRequest(app, agentToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Sanitized ticket',
        description: '<script>alert(1)</script>Safe description text',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    expect(response.body.data.description).toBe(
      'alert(1)Safe description text',
    );
  });

  it('blocks cross-tenant header spoofing for regular users', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken)
      .get('/api/v1/tickets')
      .set(TENANT_ID_HEADER, fixtures.tenantB.id)
      .expect(403);
  });
});
