import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import { authRequest, login } from '../../../test/integration/http-client.js';

describe.sequential('Customers list pagination integration', () => {
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

  it('returns paginated customers with search filter', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const response = await api
      .get('/api/v1/customers')
      .query({
        search: fixtures.customerA.name,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.some(
        (customer: { id: string }) => customer.id === fixtures.customerA.id,
      ),
    ).toBe(true);
  });
});
