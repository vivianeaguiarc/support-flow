import { UserRole } from '@prisma/client';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { TicketStatus } from '../../tickets/domain/ticket-enums.js';

describe.sequential('RBAC authorization integration', () => {
  let app: Express;
  let tenantId: string;
  let customerId: string;
  let agentId: string;
  let supervisorId: string;
  let ombudsmanId: string;
  let customerToken: string;
  let agentToken: string;
  let supervisorToken: string;
  let ombudsmanToken: string;
  let openTicketId: string;
  let escalatedTicketId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'RBAC Tenant', slug: `rbac-tenant-${Date.now()}` },
    });
    tenantId = tenant.id;

    const customer = await prisma.customer.create({
      data: {
        email: `customer-rbac-${Date.now()}@test.com`,
        name: 'RBAC Customer',
        tenantId,
      },
    });
    customerId = customer.id;

    const agent = await prisma.user.create({
      data: {
        email: `agent-rbac-${Date.now()}@test.com`,
        name: 'RBAC Agent',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agentId = agent.id;

    const supervisor = await prisma.user.create({
      data: {
        email: `supervisor-rbac-${Date.now()}@test.com`,
        name: 'RBAC Supervisor',
        password: 'password',
        role: UserRole.SUPERVISOR,
        tenantId,
      },
    });
    supervisorId = supervisor.id;

    const ombudsman = await prisma.user.create({
      data: {
        email: `ombudsman-rbac-${Date.now()}@test.com`,
        name: 'RBAC Ombudsman',
        password: 'password',
        role: UserRole.OMBUDSMAN,
        tenantId,
      },
    });
    ombudsmanId = ombudsman.id;

    customerToken = createAuthToken({
      id: customerId,
      email: customer.email,
      role: UserRole.CUSTOMER,
      tenantId,
    });
    agentToken = createAuthToken({
      id: agentId,
      email: agent.email,
      role: UserRole.AGENT,
      tenantId,
    });
    supervisorToken = createAuthToken({
      id: supervisorId,
      email: supervisor.email,
      role: UserRole.SUPERVISOR,
      tenantId,
    });
    ombudsmanToken = createAuthToken({
      id: ombudsmanId,
      email: ombudsman.email,
      role: UserRole.OMBUDSMAN,
      tenantId,
    });

    const openTicket = await prisma.ticket.create({
      data: {
        tenantId,
        protocol: 'RBAC-OPEN',
        title: 'Open ticket',
        description: 'Open ticket for RBAC tests',
        status: TicketStatus.OPEN,
        customerId,
      },
    });
    openTicketId = openTicket.id;

    const escalatedTicket = await prisma.ticket.create({
      data: {
        tenantId,
        protocol: 'RBAC-ESC',
        title: 'Escalated ticket',
        description: 'Escalated ticket for RBAC tests',
        status: TicketStatus.ESCALATED,
        customerId,
      },
    });
    escalatedTicketId = escalatedTicket.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should return 401 without authentication', async () => {
    await request(app).get('/api/v1/tickets').expect(401);
  });

  it('should block customer from internal comments', async () => {
    const api = authRequest(app, customerToken);

    await api
      .post(`/api/v1/tickets/${openTicketId}/comments`)
      .send({ content: 'Customer comment' })
      .expect(403);

    await api.get(`/api/v1/tickets/${openTicketId}/comments`).expect(403);
  });

  it('should block customer from assigning tickets', async () => {
    await authRequest(app, customerToken)
      .patch(`/api/v1/tickets/${openTicketId}/assign`)
      .send({ assignedToId: agentId })
      .expect(403);
  });

  it('should block customer from changing ticket status directly', async () => {
    await authRequest(app, customerToken)
      .patch(`/api/v1/tickets/${openTicketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(403);
  });

  it('should allow supervisor to access metrics and assign tickets', async () => {
    const api = authRequest(app, supervisorToken);

    await api.get('/api/v1/tickets/metrics').expect(200);
    await api
      .patch(`/api/v1/tickets/${openTicketId}/assign`)
      .send({ assignedToId: agentId })
      .expect(200);
  });

  it('should allow ombudsman only on escalated tickets', async () => {
    const api = authRequest(app, ombudsmanToken);

    await api.get(`/api/v1/tickets/${openTicketId}`).expect(403);
    await api.get(`/api/v1/tickets/${escalatedTicketId}`).expect(200);
    await api.get('/api/v1/tickets').expect(200);
  });

  it('should return 403 for cross-tenant ticket access', async () => {
    const otherTenant = await prisma.tenant.create({
      data: { name: 'Other Tenant', slug: `other-rbac-${Date.now()}` },
    });

    const otherCustomer = await prisma.customer.create({
      data: {
        email: `other-customer-${Date.now()}@test.com`,
        name: 'Other Customer',
        tenantId: otherTenant.id,
      },
    });

    const otherTicket = await prisma.ticket.create({
      data: {
        tenantId: otherTenant.id,
        protocol: 'RBAC-OTHER',
        title: 'Other tenant ticket',
        description: 'Cross tenant',
        status: TicketStatus.OPEN,
        customerId: otherCustomer.id,
      },
    });

    await authRequest(app, agentToken)
      .get(`/api/v1/tickets/${otherTicket.id}`)
      .expect(403);
  });
});
