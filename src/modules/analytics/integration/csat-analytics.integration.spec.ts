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
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { TicketStatus } from '../../tickets/domain/ticket-enums.js';

describe.sequential('CSAT analytics integration', () => {
  let app: Express;
  let tenantId: string;
  let agent1Id: string;
  let agent2Id: string;
  let customerId: string;
  let adminToken: string;
  let supervisorToken: string;
  let agent1Token: string;
  let agent2Token: string;
  let customerToken: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'CSAT Tenant', slug: `csat-tenant-${Date.now()}` },
    });
    tenantId = tenant.id;

    const admin = await prisma.user.create({
      data: {
        tenantId,
        name: 'Admin CSAT',
        email: `admin-csat-${Date.now()}@test.com`,
        password: 'password',
        role: UserRole.ADMIN,
      },
    });

    const supervisor = await prisma.user.create({
      data: {
        tenantId,
        name: 'Supervisor CSAT',
        email: `supervisor-csat-${Date.now()}@test.com`,
        password: 'password',
        role: UserRole.SUPERVISOR,
      },
    });

    const agent1 = await prisma.user.create({
      data: {
        tenantId,
        name: 'Agent 1 CSAT',
        email: `agent1-csat-${Date.now()}@test.com`,
        password: 'password',
        role: UserRole.AGENT,
      },
    });
    agent1Id = agent1.id;

    const agent2 = await prisma.user.create({
      data: {
        tenantId,
        name: 'Agent 2 CSAT',
        email: `agent2-csat-${Date.now()}@test.com`,
        password: 'password',
        role: UserRole.AGENT,
      },
    });
    agent2Id = agent2.id;

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: 'Customer CSAT',
        email: `customer-csat-${Date.now()}@test.com`,
      },
    });
    customerId = customer.id;

    adminToken = createAuthToken({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      tenantId,
    });
    supervisorToken = createAuthToken({
      id: supervisor.id,
      email: supervisor.email,
      role: UserRole.SUPERVISOR,
      tenantId,
    });
    agent1Token = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId,
    });
    agent2Token = createAuthToken({
      id: agent2.id,
      email: agent2.email,
      role: UserRole.AGENT,
      tenantId,
    });
    customerToken = createAuthToken({
      id: customer.id,
      email: customer.email,
      role: UserRole.CUSTOMER,
      tenantId,
    });

    const ticket1 = await prisma.ticket.create({
      data: {
        tenantId,
        protocol: 'SF-CSAT-A-001',
        title: 'Ticket Agent 1',
        description: 'CSAT analytics',
        status: TicketStatus.RESOLVED,
        priority: 'MEDIUM',
        customerId,
        assignedToId: agent1Id,
      },
    });

    const ticket2 = await prisma.ticket.create({
      data: {
        tenantId,
        protocol: 'SF-CSAT-A-002',
        title: 'Ticket Agent 2',
        description: 'CSAT analytics',
        status: TicketStatus.CLOSED,
        priority: 'LOW',
        customerId,
        assignedToId: agent2Id,
      },
    });

    await prisma.ticketSatisfactionSurvey.createMany({
      data: [
        {
          tenantId,
          ticketId: ticket1.id,
          customerId,
          rating: 5,
          submittedAt: new Date('2026-06-20T10:00:00.000Z'),
        },
        {
          tenantId,
          ticketId: ticket2.id,
          customerId,
          rating: 3,
          submittedAt: new Date('2026-06-21T10:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should return CSAT metrics for admin and supervisor', async () => {
    const adminResponse = await authRequest(app, adminToken)
      .get('/api/v1/analytics/csat')
      .expect(200);

    expect(adminResponse.body.data).toMatchObject({
      averageRating: 4,
      totalSurveys: 2,
    });
    expect(adminResponse.body.data.distribution).toEqual(
      expect.arrayContaining([
        { rating: 3, count: 1 },
        { rating: 5, count: 1 },
      ]),
    );
    expect(adminResponse.body.data.byAgent).toHaveLength(2);

    const supervisorResponse = await authRequest(app, supervisorToken)
      .get('/api/v1/analytics/csat')
      .expect(200);

    expect(supervisorResponse.body.data.totalSurveys).toBe(2);
  });

  it('should scope CSAT metrics to agent own tickets', async () => {
    const agent1Response = await authRequest(app, agent1Token)
      .get('/api/v1/analytics/csat')
      .expect(200);

    expect(agent1Response.body.data).toMatchObject({
      averageRating: 5,
      totalSurveys: 1,
    });
    expect(agent1Response.body.data.byAgent).toHaveLength(1);
    expect(agent1Response.body.data.byAgent[0].agentId).toBe(agent1Id);

    const agent2Response = await authRequest(app, agent2Token)
      .get('/api/v1/analytics/csat')
      .expect(200);

    expect(agent2Response.body.data).toMatchObject({
      averageRating: 3,
      totalSurveys: 1,
    });
  });

  it('should forbid customer from CSAT analytics', async () => {
    await authRequest(app, customerToken)
      .get('/api/v1/analytics/csat')
      .expect(403);
  });
});
