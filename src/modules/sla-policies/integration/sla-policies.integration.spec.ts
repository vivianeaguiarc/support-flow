import { randomUUID } from 'node:crypto';

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
import {
  type IntegrationFixtures,
  seedIntegrationFixtures,
} from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';

const BASE_URL = '/api/v1/sla-policies';

function tokenForRole(
  fixtures: IntegrationFixtures,
  role: UserRole,
  tenantId = fixtures.tenantA.id,
): string {
  return createAuthToken({
    id: randomUUID(),
    email: `${role.toLowerCase()}-${Date.now()}@supportflow.test`,
    role,
    tenantId,
  });
}

describe.sequential('SLA policies integration', () => {
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

  it('allows an admin to run the full CRUD lifecycle with auditing', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(app, tokenForRole(fixtures, UserRole.ADMIN));

    const createResponse = await adminApi
      .post(BASE_URL)
      .send({
        name: 'SLA Alta Prioridade',
        description: 'Política para chamados de alta prioridade',
        priority: 'HIGH',
        categoryIds: [fixtures.categoryA.id],
        firstResponseHours: 4,
        resolutionHours: 24,
      })
      .expect(201);

    const policyId = createResponse.body.data.id as string;
    expect(createResponse.body.data.categoryIds).toEqual([
      fixtures.categoryA.id,
    ]);
    expect(createResponse.body.data.isActive).toBe(true);

    const listResponse = await adminApi.get(BASE_URL).expect(200);
    expect(listResponse.body.data).toHaveLength(1);

    const getResponse = await adminApi
      .get(`${BASE_URL}/${policyId}`)
      .expect(200);
    expect(getResponse.body.data.id).toBe(policyId);

    await adminApi
      .patch(`${BASE_URL}/${policyId}`)
      .send({ resolutionHours: 16, isActive: false })
      .expect(200);

    const auditLogs = await prisma.auditLog.findMany({
      where: { entity: 'sla_policy', organizationId: fixtures.tenantA.id },
      orderBy: { sequence: 'asc' },
    });
    expect(auditLogs.map((log) => log.action)).toEqual([
      'sla_policy.created',
      'sla_policy.updated',
    ]);

    await adminApi.del(`${BASE_URL}/${policyId}`).expect(200);

    const emptyList = await adminApi.get(BASE_URL).expect(200);
    expect(emptyList.body.data).toHaveLength(0);

    const deleteAudit = await prisma.auditLog.findFirst({
      where: { entity: 'sla_policy', action: 'sla_policy.deleted' },
    });
    expect(deleteAudit).not.toBeNull();
  });

  it('validates response/resolution ordering and category existence', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(app, tokenForRole(fixtures, UserRole.ADMIN));

    await adminApi
      .post(BASE_URL)
      .send({
        name: 'Inválida',
        firstResponseHours: 10,
        resolutionHours: 4,
      })
      .expect(400);

    await adminApi
      .post(BASE_URL)
      .send({
        name: 'Categoria inexistente',
        categoryIds: [randomUUID()],
        firstResponseHours: 4,
        resolutionHours: 24,
      })
      .expect(400);
  });

  it('rejects duplicate policy names within the tenant', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(app, tokenForRole(fixtures, UserRole.ADMIN));

    const payload = {
      name: 'SLA Padrão',
      firstResponseHours: 4,
      resolutionHours: 24,
    };

    await adminApi.post(BASE_URL).send(payload).expect(201);
    await adminApi.post(BASE_URL).send(payload).expect(409);
  });

  it('enforces RBAC across roles', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(app, tokenForRole(fixtures, UserRole.ADMIN));
    const agentApi = authRequest(app, tokenForRole(fixtures, UserRole.AGENT));
    const supervisorApi = authRequest(
      app,
      tokenForRole(fixtures, UserRole.SUPERVISOR),
    );
    const customerApi = authRequest(
      app,
      tokenForRole(fixtures, UserRole.CUSTOMER),
    );

    const created = await adminApi
      .post(BASE_URL)
      .send({ name: 'RBAC', firstResponseHours: 4, resolutionHours: 24 })
      .expect(201);
    const policyId = created.body.data.id as string;

    // AGENT: read only
    await agentApi.get(BASE_URL).expect(200);
    await agentApi
      .post(BASE_URL)
      .send({ name: 'Agent', firstResponseHours: 4, resolutionHours: 24 })
      .expect(403);

    // SUPERVISOR: read + update, but not create or delete
    await supervisorApi.get(BASE_URL).expect(200);
    await supervisorApi
      .patch(`${BASE_URL}/${policyId}`)
      .send({ isActive: false })
      .expect(200);
    await supervisorApi
      .post(BASE_URL)
      .send({ name: 'Sup', firstResponseHours: 4, resolutionHours: 24 })
      .expect(403);
    await supervisorApi.del(`${BASE_URL}/${policyId}`).expect(403);

    // CUSTOMER: no access at all
    await customerApi.get(BASE_URL).expect(403);
  });

  it('isolates policies between tenants', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(app, tokenForRole(fixtures, UserRole.ADMIN));
    const otherTenantAdmin = authRequest(
      app,
      tokenForRole(fixtures, UserRole.ADMIN, fixtures.tenantB.id),
    );

    const created = await adminApi
      .post(BASE_URL)
      .send({ name: 'Isolada', firstResponseHours: 4, resolutionHours: 24 })
      .expect(201);
    const policyId = created.body.data.id as string;

    await otherTenantAdmin.get(`${BASE_URL}/${policyId}`).expect(404);
    const otherList = await otherTenantAdmin.get(BASE_URL).expect(200);
    expect(otherList.body.data).toHaveLength(0);
  });
});
