import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
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
  login,
} from '../../../test/integration/http-client.js';
import { QueueName } from '../../queues/domain/queue-names.js';

describe.sequential('Admin jobs integration', () => {
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

  it('should allow admin to list job queue overview and metrics', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const overviewResponse = await adminApi
      .get('/api/v1/admin/jobs')
      .expect(200);

    expect(overviewResponse.body.data.queues[QueueName.EMAIL]).toMatchObject({
      waiting: expect.any(Number),
      active: expect.any(Number),
      completed: expect.any(Number),
      failed: expect.any(Number),
    });
    expect(overviewResponse.body.data.totals).toMatchObject({
      waiting: expect.any(Number),
      active: expect.any(Number),
      completed: expect.any(Number),
      failed: expect.any(Number),
    });

    const metricsResponse = await adminApi
      .get('/api/v1/admin/jobs/metrics')
      .expect(200);

    expect(metricsResponse.body.data.queues.length).toBeGreaterThan(0);
    expect(metricsResponse.body.data.generatedAt).toBeTruthy();
  });

  it('should forbid non-admin from accessing job monitoring', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken).get('/api/v1/admin/jobs').expect(403);
    await authRequest(app, agentToken)
      .get('/api/v1/admin/jobs/metrics')
      .expect(403);
  });
});
