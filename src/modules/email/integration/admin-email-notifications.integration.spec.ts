import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  integrationPrisma,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';

describe.sequential('Admin email notifications health', () => {
  let app: Express;
  let adminToken: string;
  let agentToken: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp({ swagger: true });
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await integrationPrisma.tenant.create({
      data: {
        name: 'Email Health Tenant',
        slug: `email-health-${Date.now()}`,
      },
    });

    const admin = await integrationPrisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Admin Email',
        email: `admin-email-${Date.now()}@supportflow.test`,
        password: 'password',
        role: UserRole.ADMIN,
      },
    });

    const agent = await integrationPrisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Agent Email',
        email: `agent-email-${Date.now()}@supportflow.test`,
        password: 'password',
        role: UserRole.AGENT,
      },
    });

    adminToken = createAuthToken({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    });

    agentToken = createAuthToken({
      id: agent.id,
      email: agent.email,
      role: UserRole.AGENT,
      tenantId: tenant.id,
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should allow admin to check email health', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/admin/notifications/health',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      provider: 'noop',
      enabled: false,
      ready: true,
    });
  });

  it('should block non-admin from email health endpoint', async () => {
    const response = await authRequest(app, agentToken).get(
      '/api/v1/admin/notifications/health',
    );

    expect(response.status).toBe(403);
  });
});
