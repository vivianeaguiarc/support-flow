import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import {
  API_VERSION,
  apiVersionBasePath,
} from '../../shared/http/api-version.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from './database.js';
import { seedIntegrationFixtures } from './fixtures.js';
import { authRequest, login, unwrapApiData } from './http-client.js';

describe.sequential('API versioning integration', () => {
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

  it('should keep v1 ticket listing working', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const response = await authRequest(app, token)
      .get(`${apiVersionBasePath(API_VERSION.V1)}/tickets`)
      .expect(200);

    expect(unwrapApiData(response.body)).toEqual(expect.any(Array));
  });

  it('should authenticate and list tickets on v2', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const response = await authRequest(app, token)
      .get(`${apiVersionBasePath(API_VERSION.V2)}/tickets`)
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v2');
    expect(unwrapApiData(response.body)).toEqual(expect.any(Array));
  });

  it('should return 404 for unknown versioned routes', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await authRequest(app, token)
      .get(`${apiVersionBasePath(API_VERSION.V2)}/unknown-resource`)
      .expect(404);
  });
});
