import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import { PermissionKey } from '../../../shared/security/permissions.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  getApiErrorMessage,
  login,
} from '../../../test/integration/http-client.js';

describe.sequential('RBAC admin', () => {
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

  it('lists permissions for tenant admin', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = await login(
      app,
      fixtures.adminA.email,
      fixtures.password,
    );

    const response = await authRequest(app, adminToken)
      .get('/api/v1/admin/permissions')
      .expect(200);

    const keys = response.body.data.map((item: { key: string }) => item.key);
    expect(keys).toContain(PermissionKey.TICKETS_READ);
    expect(keys).toContain(PermissionKey.ROLES_MANAGE);
  });

  it('creates role and assigns permissions with audit trail', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = await login(
      app,
      fixtures.adminA.email,
      fixtures.password,
    );

    const created = await authRequest(app, adminToken)
      .post('/api/v1/admin/roles')
      .send({
        name: 'Support Lead',
        description: 'Leads support operations',
      })
      .expect(201);

    const roleId = created.body.data.id as string;

    await authRequest(app, adminToken)
      .post(`/api/v1/admin/roles/${roleId}/permissions`)
      .send({
        permissionKeys: [
          PermissionKey.TICKETS_READ,
          PermissionKey.TICKETS_ASSIGN,
        ],
      })
      .expect(200);

    const audits = await prisma.securityAuditLog.findMany({
      where: {
        event: { in: ['ROLE_CREATED', 'ROLE_PERMISSIONS_UPDATED'] },
        tenantId: fixtures.tenantA.id,
      },
    });

    expect(audits.length).toBeGreaterThanOrEqual(2);
  });

  it('denies role management without roles.manage permission', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const response = await authRequest(app, agentToken)
      .get('/api/v1/admin/roles')
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe('Forbidden');
  });

  it('allows users.manage to list users via permission middleware', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = await login(
      app,
      fixtures.adminA.email,
      fixtures.password,
    );

    await authRequest(app, adminToken).get('/api/v1/users').expect(200);
  });
});
