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
import {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

describe.sequential('Analytics API', () => {
  let app: Express;
  let tenant1Id: string;
  let tenant2Id: string;
  let agent1Id: string;
  let adminToken: string;
  let supervisorToken: string;
  let agentToken: string;
  let customerId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1 Analytics',
        slug: 'tenant-1-analytics',
      },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant 2 Analytics',
        slug: 'tenant-2-analytics',
      },
    });
    tenant2Id = tenant2.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin-analytics@test.com',
        name: 'Admin Analytics',
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

    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor-analytics@test.com',
        name: 'Supervisor Analytics',
        password: 'password',
        role: UserRole.SUPERVISOR,
        tenantId: tenant1Id,
      },
    });

    supervisorToken = createAuthToken({
      id: supervisor.id,
      email: supervisor.email,
      role: UserRole.SUPERVISOR,
      tenantId: tenant1Id,
    });

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-analytics@test.com',
        name: 'Agent 1 Analytics',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });
    agent1Id = agent1.id;

    agentToken = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId: tenant1Id,
    });

    const customer = await prisma.customer.create({
      data: {
        email: 'customer-analytics@test.com',
        name: 'Customer Analytics',
        tenantId: tenant1Id,
      },
    });
    customerId = customer.id;

    const now = Date.now();

    await prisma.ticket.createMany({
      data: [
        {
          tenantId: tenant1Id,
          protocol: 'AN-001',
          title: 'Open ticket',
          description: 'Open',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
          customerId,
          assignedToId: agent1Id,
          slaDueAt: new Date(now + 48 * 60 * 60 * 1000),
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        },
        {
          tenantId: tenant1Id,
          protocol: 'AN-002',
          title: 'In progress ticket',
          description: 'In progress',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
          customerId,
          assignedToId: agent1Id,
          slaDueAt: new Date(now - 2 * 60 * 60 * 1000),
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
        },
        {
          tenantId: tenant1Id,
          protocol: 'AN-003',
          title: 'Resolved ticket',
          description: 'Resolved',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.LOW,
          customerId,
          assignedToId: agent1Id,
          slaDueAt: new Date('2026-06-03T18:00:00.000Z'),
          closedAt: new Date('2026-06-03T14:00:00.000Z'),
          createdAt: new Date('2026-06-03T10:00:00.000Z'),
        },
        {
          tenantId: tenant2Id,
          protocol: 'AN-004',
          title: 'Other tenant ticket',
          description: 'Tenant 2',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId: (
            await prisma.customer.create({
              data: {
                email: 'customer2-analytics@test.com',
                name: 'Customer 2',
                tenantId: tenant2Id,
              },
            })
          ).id,
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('GET /analytics/overview should return dashboard metrics for admin', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/overview',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      totalTickets: 3,
      openTickets: 1,
      inProgressTickets: 1,
      resolvedTickets: 1,
      slaBreachedTickets: 1,
    });
    expect(response.body.data.ticketsCreatedByPeriod).toEqual(
      expect.arrayContaining([
        { period: '2026-06-01', count: 1 },
        { period: '2026-06-02', count: 1 },
        { period: '2026-06-03', count: 1 },
      ]),
    );
  });

  it('GET /analytics/overview should allow supervisor access', async () => {
    const response = await authRequest(app, supervisorToken).get(
      '/api/v1/analytics/overview',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.totalTickets).toBe(3);
  });

  it('GET /analytics/overview should deny agent access', async () => {
    const response = await authRequest(app, agentToken).get(
      '/api/v1/analytics/overview',
    );

    expect(response.status).toBe(403);
  });

  it('GET /analytics/tickets-by-status should return grouped counts', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/tickets-by-status',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(3);
    expect(response.body.data.byStatus.OPEN).toBe(1);
    expect(response.body.data.byStatus.IN_PROGRESS).toBe(1);
    expect(response.body.data.byStatus.RESOLVED).toBe(1);
  });

  it('GET /analytics/tickets-by-priority should return grouped counts', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/tickets-by-priority',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(3);
    expect(response.body.data.byPriority.HIGH).toBe(1);
    expect(response.body.data.byPriority.MEDIUM).toBe(1);
    expect(response.body.data.byPriority.LOW).toBe(1);
  });

  it('GET /analytics/sla should return SLA indicators', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/sla',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      onTime: 1,
      breached: 1,
      total: 2,
      slaBreachedTickets: 1,
    });
    expect(response.body.data.slaComplianceRate).toBe(100);
  });

  it('GET /analytics/agents-performance should return agent productivity', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/agents-performance',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.agents).toHaveLength(1);
    expect(response.body.data.agents[0]).toMatchObject({
      agentId: agent1Id,
      agentName: 'Agent 1 Analytics',
      assignedTickets: 3,
      resolvedTickets: 1,
      openTickets: 2,
      slaBreachedTickets: 1,
    });
    expect(response.body.data.agents[0].avgResolutionTimeHours).toBe(4);
  });

  it('should filter analytics by startDate and endDate', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/analytics/overview?startDate=2026-06-02T00:00:00.000Z&endDate=2026-06-03T23:59:59.999Z',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.totalTickets).toBe(2);
    expect(response.body.data.ticketsCreatedByPeriod).toEqual([
      { period: '2026-06-02', count: 1 },
      { period: '2026-06-03', count: 1 },
    ]);
  });

  it('should filter analytics by agentId', async () => {
    const response = await authRequest(app, adminToken).get(
      `/api/v1/analytics/tickets-by-status?agentId=${agent1Id}&status=OPEN`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.byStatus.OPEN).toBe(1);
  });
});
