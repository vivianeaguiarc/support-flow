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

describe.sequential('GET /tickets/summary', () => {
  let app: Express;
  let tenant1Id: string;
  let tenant2Id: string;
  let agent1Id: string;
  let agent1Token: string;
  let agent2Token: string;
  let customer1Token: string;
  let customer1Id: string;
  let customer2Id: string;
  let category1Id: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1 Summary',
        slug: 'tenant-1-summary',
      },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant 2 Summary',
        slug: 'tenant-2-summary',
      },
    });
    tenant2Id = tenant2.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-summary@test.com',
        name: 'Agent 1 Summary',
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
        email: 'agent2-summary@test.com',
        name: 'Agent 2 Summary',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant2Id,
      },
    });

    agent2Token = createAuthToken({
      id: agent2.id,
      email: agent2.email,
      role: UserRole.AGENT,
      tenantId: tenant2Id,
    });

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-summary@test.com',
        name: 'Customer 1 Summary',
        tenantId: tenant1Id,
      },
    });
    customer1Id = customer1.id;

    const customer2 = await prisma.customer.create({
      data: {
        email: 'customer2-summary@test.com',
        name: 'Customer 2 Summary',
        tenantId: tenant1Id,
      },
    });
    customer2Id = customer2.id;

    const category1 = await prisma.ticketCategory.create({
      data: {
        name: 'Category 1 Summary',
        tenantId: tenant1Id,
      },
    });
    category1Id = category1.id;

    customer1Token = createAuthToken({
      id: customer1Id,
      email: 'customer1-summary@test.com',
      role: UserRole.CUSTOMER,
      tenantId: tenant1Id,
    });

    const now = new Date();
    const pastDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await prisma.ticket.createMany({
      data: [
        {
          tenantId: tenant1Id,
          protocol: 'T1-001',
          title: 'Ticket 1 OPEN',
          description: 'Description 1',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId: customer1Id,
          categoryId: category1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-002',
          title: 'Ticket 2 IN_PROGRESS',
          description: 'Description 2',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-003',
          title: 'Ticket 3 IN_PROGRESS',
          description: 'Description 3',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.HIGH,
          customerId: customer2Id,
          assignedToId: agent1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-004',
          title: 'Ticket 4 WAITING_CUSTOMER',
          description: 'Description 4',
          status: TicketStatus.WAITING_CUSTOMER,
          priority: TicketPriority.MEDIUM,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-005',
          title: 'Ticket 5 ESCALATED',
          description: 'Description 5',
          status: TicketStatus.ESCALATED,
          priority: TicketPriority.URGENT,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-006',
          title: 'Ticket 6 RESOLVED',
          description: 'Description 6',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.LOW,
          customerId: customer2Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-007',
          title: 'Ticket 7 CLOSED',
          description: 'Description 7',
          status: TicketStatus.CLOSED,
          priority: TicketPriority.LOW,
          customerId: customer1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-008',
          title: 'Ticket 8 OVERDUE OPEN',
          description: 'Description 8',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
          customerId: customer1Id,
          slaDueAt: pastDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-009',
          title: 'Ticket 9 OVERDUE IN_PROGRESS',
          description: 'Description 9',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.MEDIUM,
          customerId: customer2Id,
          assignedToId: agent1Id,
          slaDueAt: pastDate,
        },
        {
          tenantId: tenant1Id,
          protocol: 'T1-010',
          title: 'Ticket 10 UNASSIGNED OPEN',
          description: 'Description 10',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId: customer1Id,
          slaDueAt: futureDate,
        },
        {
          tenantId: tenant2Id,
          protocol: 'T2-001',
          title: 'Ticket from Tenant 2',
          description: 'Description T2',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
          customerId: customer2Id,
          slaDueAt: futureDate,
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should return ticket summary for tenant1 with correct counts', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      total: 10,
      open: 3,
      inProgress: 3,
      waitingCustomer: 1,
      escalated: 1,
      resolved: 1,
      closed: 1,
      overdue: 2,
      unassigned: 5,
    });

    expect(response.body.byStatus).toEqual({
      OPEN: 3,
      IN_PROGRESS: 3,
      WAITING_CUSTOMER: 1,
      ESCALATED: 1,
      RESOLVED: 1,
      CLOSED: 1,
    });

    expect(response.body.byPriority).toEqual({
      LOW: 4,
      MEDIUM: 3,
      HIGH: 2,
      URGENT: 1,
    });
  });

  it('should isolate tenant data correctly', async () => {
    const api = authRequest(app, agent2Token);
    const response = await api.get('/api/v1/tickets/summary');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.open).toBe(1);
    expect(response.body.inProgress).toBe(0);
  });

  it('should filter summary by status', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?status=OPEN');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(3);
    expect(response.body.open).toBe(3);
    expect(response.body.inProgress).toBe(0);
  });

  it('should filter summary by priority', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?priority=HIGH');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.byPriority.HIGH).toBe(2);
  });

  it('should filter summary by categoryId', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get(
      `/api/v1/tickets/summary?categoryId=${category1Id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
  });

  it('should filter summary by customerId', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get(
      `/api/v1/tickets/summary?customerId=${customer1Id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(7);
  });

  it('should filter summary by unassigned', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?unassigned=true');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(5);
    expect(response.body.unassigned).toBe(5);
  });

  it('should filter summary by overdue', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?overdue=true');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.overdue).toBe(2);
  });

  it('should filter summary by search term', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?search=OVERDUE');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  it('should filter summary by date range', async () => {
    const api = authRequest(app, agent1Token);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const response = await api.get(
      `/api/v1/tickets/summary?createdFrom=${yesterday}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(10);
  });

  it('should allow customer to view their own summary', async () => {
    const api = authRequest(app, customer1Token);
    const response = await api.get('/api/v1/tickets/summary');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(7);
  });

  it('should return validation error for invalid filters', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get('/api/v1/tickets/summary?status=INVALID');

    expect(response.status).toBe(400);
  });

  it('should return validation error for conflicting unassigned and assignedToId', async () => {
    const api = authRequest(app, agent1Token);
    const response = await api.get(
      '/api/v1/tickets/summary?unassigned=true&assignedToId=some-uuid',
    );

    expect(response.status).toBe(400);
  });
});
