import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
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
} from '../../../test/integration/http-client.js';
import { FeatureFlagKey } from '../domain/feature-flag-keys.js';

describe.sequential('Admin feature flags integration', () => {
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

  it('allows super admin to create, list, update and delete feature flags', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.superAdmin.id,
      email: fixtures.superAdmin.email,
      role: UserRole.SUPER_ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const createResponse = await adminApi
      .post('/api/v1/admin/feature-flags')
      .send({
        key: FeatureFlagKey.WEBHOOKS,
        description: 'Outbound webhooks',
        enabled: false,
      })
      .expect(201);

    expect(createResponse.body.data).toMatchObject({
      key: FeatureFlagKey.WEBHOOKS,
      enabled: false,
    });

    const listResponse = await adminApi
      .get('/api/v1/admin/feature-flags')
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);

    await adminApi
      .patch(`/api/v1/admin/feature-flags/${FeatureFlagKey.WEBHOOKS}`)
      .send({ enabled: true })
      .expect(200);

    const audits = await prisma.featureFlagAudit.findMany({
      where: { key: FeatureFlagKey.WEBHOOKS },
      orderBy: { createdAt: 'asc' },
    });

    expect(audits.map((audit) => audit.action)).toEqual(['CREATED', 'UPDATED']);

    await adminApi
      .del(`/api/v1/admin/feature-flags/${FeatureFlagKey.WEBHOOKS}`)
      .expect(200);

    const afterDelete = await adminApi
      .get('/api/v1/admin/feature-flags')
      .expect(200);

    expect(afterDelete.body.data).toHaveLength(0);
  });

  it('forbids tenant admin from managing platform feature flags', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });

    await authRequest(app, adminToken)
      .get('/api/v1/admin/feature-flags')
      .expect(403);
  });

  it('forbids non-admin users from managing feature flags', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = createAuthToken({
      id: fixtures.agentA.id,
      email: fixtures.agentA.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantA.id,
    });

    await authRequest(app, agentToken)
      .get('/api/v1/admin/feature-flags')
      .expect(403);
  });

  it('blocks csv export when reports.csv flag is disabled', async () => {
    const fixtures = await seedIntegrationFixtures();
    const superAdminToken = createAuthToken({
      id: fixtures.superAdmin.id,
      email: fixtures.superAdmin.email,
      role: UserRole.SUPER_ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const superAdminApi = authRequest(app, superAdminToken);

    await superAdminApi
      .post('/api/v1/admin/feature-flags')
      .send({
        key: FeatureFlagKey.REPORTS_CSV,
        enabled: false,
      })
      .expect(201);

    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });

    await authRequest(app, adminToken)
      .get('/api/v1/reports/tickets.csv')
      .expect(403);
  });
});
