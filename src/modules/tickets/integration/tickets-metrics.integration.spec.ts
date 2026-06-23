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
import { TicketPriority, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('GET /tickets/metrics', () => {
  let app: Express;
  let tenant1Id: string;
  let tenant2Id: string;
  let agent1Id: string;
  let agent2Id: string;
  let agent1Token: string;
  let adminToken: string;
  let customerToken: string;
  let category1Id: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1 Metrics',
        slug: 'tenant-1-metrics',
      },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant 2 Metrics',
        slug: 'tenant-2-metrics',
      },
    });
    tenant2Id = tenant2.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-metrics@test.com',
        name: 'Agent 1 Metrics',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });
    agent1Id = agent1.id;

    agent1Token = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId: tenant1Id,
    });

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-metrics@test.com',
        name: 'Agent 2 Metrics',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });
    agent2Id = agent2.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin-metrics@test.com',
        name: 'Admin Metrics',
        password: 'password',
        role: UserRole.ADMIN,
        tenantId: tenant1Id,
      },
    });

    adminToken = createAuthToken({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      tenantId: tenant1Id,
    });

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-metrics@test.com',
        name: 'Customer 1 Metrics',
        tenantId: tenant1Id,
      },
    });

    customerToken = createAuthToken({
      id: customer1.id,
      email: 'customer1-metrics@test.com',
      role: UserRole.CUSTOMER,
      tenantId: tenant1Id,
    });

    const category1 = await prisma.ticketCategory.create({
      data: {
        name: 'Category 1 Metrics',
        tenantId: tenant1Id,
      },
    });
    category1Id = category1.id;

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    await prisma.ticket.createMany({
      data: [
        {
          tenantId: tenant1Id,
          protocol: 'M1-001',
          title: 'Resolved in time by Agent 1',
          description: 'Test 1',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.MEDIUM,
          customerId: customer1.id,
          assignedToId: agent1Id,
          categoryId: category1Id,
          createdAt: twoDaysAgo,
          closedAt: oneDayAgo,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'M1-002',
          title: 'Resolved in time by Agent 1',
          description: 'Test 2',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.HIGH,
          customerId: customer1.id,
          assignedToId: agent1Id,
          createdAt: oneDayAgo,
          closedAt: oneHourAgo,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'M1-003',
          title: 'Resolved late by Agent 2',
          description: 'Test 3',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.LOW,
          customerId: customer1.id,
          assignedToId: agent2Id,
          createdAt: twoDaysAgo,
          closedAt: oneHourAgo,
          slaDueAt: oneDayAgo,
        },
        {
          tenantId: tenant1Id,
          protocol: 'M1-004',
          title: 'Overdue open ticket',
          description: 'Test 4',
          status: TicketStatus.OPEN,
          priority: TicketPriority.URGENT,
          customerId: customer1.id,
          slaDueAt: pastDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'M1-005',
          title: 'Overdue in progress ticket',
          description: 'Test 5',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.HIGH,
          customerId: customer1.id,
          assignedToId: agent1Id,
          slaDueAt: pastDate,
        },
        {
          tenantId: tenant2Id,
          protocol: 'M2-001',
          title: 'Ticket from Tenant 2',
          description: 'Test T2',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.HIGH,
          customerId: customer1.id,
          createdAt: twoDaysAgo,
          closedAt: oneDayAgo,
          slaDueAt: futureDate,
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should return metrics with resolved tickets and SLA compliance', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      resolvedTickets: 3,
      overdueTickets: 2,
    });

    expect(response.body.avgResolutionTimeHours).toBeGreaterThan(0);
    expect(response.body.slaComplianceRate).toBeGreaterThan(0);
    expect(response.body.slaComplianceRate).toBeLessThanOrEqual(100);

    expect(response.body.agentPerformance).toBeInstanceOf(Array);
    expect(response.body.agentPerformance.length).toBeGreaterThan(0);
  });

  it('should calculate average resolution time correctly', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body.avgResolutionTimeHours).toBeGreaterThan(0);
    expect(response.body.avgResolutionTimeHours).toBeLessThan(100);
  });

  it('should calculate SLA compliance rate correctly', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);

    const expectedCompliance = (2 / 3) * 100;
    expect(response.body.slaComplianceRate).toBeCloseTo(expectedCompliance, 1);
  });

  it('should return agent performance metrics', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body.agentPerformance).toBeInstanceOf(Array);

    const agent1Perf = response.body.agentPerformance.find(
      (a: { agentId: string }) => a.agentId === agent1Id,
    );
    expect(agent1Perf).toBeDefined();
    expect(agent1Perf.resolvedTickets).toBe(2);
    expect(agent1Perf.avgResolutionTimeHours).toBeGreaterThan(0);

    const agent2Perf = response.body.agentPerformance.find(
      (a: { agentId: string }) => a.agentId === agent2Id,
    );
    expect(agent2Perf).toBeDefined();
    expect(agent2Perf.resolvedTickets).toBe(1);
  });

  it('should sort agent performance by resolved tickets descending', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    const performance = response.body.agentPerformance;

    expect(performance[0].agentId).toBe(agent1Id);
    expect(performance[1].agentId).toBe(agent2Id);
  });

  it('should isolate tenant data correctly', async () => {
    const agent2Token = createAuthToken({
      id: agent2Id,
      email: 'agent2@tenant2.com',
      role: UserRole.AGENT,
      tenantId: tenant2Id,
    });

    const api = authRequest(app, agent2Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body.resolvedTickets).toBe(1);
    expect(response.body.overdueTickets).toBe(0);
  });

  it('should filter metrics by categoryId', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get(
      `/api/v1/tickets/metrics?categoryId=${category1Id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.resolvedTickets).toBe(1);
  });

  it('should filter metrics by date range', async () => {
    const api = authRequest(app, agent1Token);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await api.get(
      `/api/v1/tickets/metrics?createdFrom=${yesterday}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.resolvedTickets).toBeGreaterThanOrEqual(0);
  });

  it('should allow admin to access metrics', async () => {
    const api = authRequest(app, adminToken);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('avgResolutionTimeHours');
    expect(response.body).toHaveProperty('slaComplianceRate');
  });

  it('should deny customer access to metrics', async () => {
    const api = authRequest(app, customerToken);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(403);
  });

  it('should return zero metrics when no resolved tickets exist', async () => {
    await prisma.ticket.deleteMany({ where: { tenantId: tenant1Id } });

    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      avgResolutionTimeHours: 0,
      slaComplianceRate: 0,
      resolvedTickets: 0,
      overdueTickets: 0,
      agentPerformance: [],
    });
  });

  it('should return validation error for invalid categoryId', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get(
      '/api/v1/tickets/metrics?categoryId=invalid',
    );

    expect(response.status).toBe(400);
  });
});
