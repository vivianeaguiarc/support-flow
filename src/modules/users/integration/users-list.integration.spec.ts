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
import { authRequest, login } from '../../../test/integration/http-client.js';

describe.sequential('Users list pagination integration', () => {
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

  it('returns paginated users with search and role filters', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = await login(
      app,
      fixtures.adminA.email,
      fixtures.password,
    );
    const api = authRequest(app, adminToken);

    const response = await api
      .get('/api/v1/users')
      .query({ search: fixtures.agentA.email, role: UserRole.AGENT, limit: 5 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 5,
      total: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe(fixtures.agentA.email);
  });

  it('rejects limit above the maximum allowed value', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = await login(
      app,
      fixtures.adminA.email,
      fixtures.password,
    );

    await authRequest(app, adminToken)
      .get('/api/v1/users')
      .query({ limit: 150 })
      .expect(400);
  });
});
