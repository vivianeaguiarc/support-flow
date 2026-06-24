import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
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
import { TicketStatus } from '../../tickets/domain/ticket-enums.js';

describe.sequential('Multi-tenant security', () => {
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

  async function createTenantATicket() {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const response = await authRequest(app, agentToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Tenant A ticket',
        description: 'Isolated ticket',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    return {
      fixtures,
      ticketId: response.body.data.id as string,
      agentToken,
    };
  }

  it('blocks cross-tenant ticket read', async () => {
    const { fixtures, ticketId } = await createTenantATicket();
    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    const response = await authRequest(app, agentBToken)
      .get(`/api/v1/tickets/${ticketId}`)
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe('Forbidden');
  });

  it('blocks cross-tenant ticket status update', async () => {
    const { fixtures, ticketId } = await createTenantATicket();
    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    const response = await authRequest(app, agentBToken)
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.CLOSED })
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe('Forbidden');
  });

  it('blocks cross-tenant ticket assignment', async () => {
    const { fixtures, ticketId } = await createTenantATicket();
    const adminBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantB.id,
    });

    const response = await authRequest(app, adminBToken)
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ agentId: fixtures.agentB.id })
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe('Forbidden');
  });

  it('blocks creating tickets with customer from another tenant', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    const response = await authRequest(app, agentToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Invalid cross-tenant customer',
        description: 'Must be rejected',
        customerId: fixtures.customerB.id,
        priority: 'LOW',
      })
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe(
      'Invalid tenant for customer',
    );
  });

  it('blocks x-tenant-id header override for regular users', async () => {
    const { fixtures, ticketId } = await createTenantATicket();
    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    const response = await authRequest(app, agentBToken)
      .get(`/api/v1/tickets/${ticketId}`)
      .set(TENANT_ID_HEADER, fixtures.tenantA.id)
      .expect(403);

    expect(getApiErrorMessage(response.body)).toBe(
      'Cross-tenant access denied',
    );
  });

  it('allows super admin to read tickets from another tenant via x-tenant-id', async () => {
    const { fixtures, ticketId } = await createTenantATicket();
    const superAdminToken = createAuthToken({
      id: fixtures.superAdmin.id,
      email: fixtures.superAdmin.email,
      role: UserRole.SUPER_ADMIN,
      tenantId: fixtures.tenantA.id,
    });

    const response = await authRequest(app, superAdminToken)
      .get(`/api/v1/tickets/${ticketId}`)
      .set(TENANT_ID_HEADER, fixtures.tenantA.id)
      .expect(200);

    expect(response.body.data.id).toBe(ticketId);
    expect(response.body.data.tenantId).toBe(fixtures.tenantA.id);
  });
});
