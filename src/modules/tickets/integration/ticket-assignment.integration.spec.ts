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
import { TicketHistoryEvent, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket assignment and queues', () => {
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

  it('should assign ticket with agentId and record ASSIGNED history', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const createResponse = await adminApi
      .post('/api/v1/tickets')
      .send({
        title: 'Assignment queue ticket',
        description: 'Ticket for assignment tests',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await adminApi
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ agentId: fixtures.agentA.id })
      .expect(200);

    const history = await prisma.ticketHistory.findMany({
      where: { ticketId, event: TicketHistoryEvent.ASSIGNED },
    });

    expect(history).toHaveLength(1);
    expect(history[0].newValue).toBe(fixtures.agentA.id);
  });

  it('should record REASSIGNED when changing assignee', async () => {
    const fixtures = await seedIntegrationFixtures();
    const supervisorApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.SUPERVISOR,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const secondAgent = await prisma.user.create({
      data: {
        tenantId: fixtures.tenantA.id,
        name: 'Second Agent',
        email: `agent-second-${Date.now()}@supportflow.test`,
        password: 'password',
        role: UserRole.AGENT,
      },
    });

    const createResponse = await supervisorApi
      .post('/api/v1/tickets')
      .send({
        title: 'Reassignment ticket',
        description: 'Ticket for reassignment test',
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await supervisorApi
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ agentId: secondAgent.id })
      .expect(200);

    const reassigned = await prisma.ticketHistory.findFirst({
      where: { ticketId, event: TicketHistoryEvent.REASSIGNED },
    });

    expect(reassigned).toBeDefined();
    expect(reassigned?.oldValue).toBe(fixtures.agentA.id);
    expect(reassigned?.newValue).toBe(secondAgent.id);
  });

  it('should block agent from assigning tickets', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.agentA.id,
        email: fixtures.agentA.email,
        role: UserRole.AGENT,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const createResponse = await agentApi
      .post('/api/v1/tickets')
      .send({
        title: 'Forbidden assign ticket',
        description: 'Agent should not assign',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    await agentApi
      .patch(`/api/v1/tickets/${createResponse.body.data.id}/assign`)
      .send({ agentId: fixtures.agentA.id })
      .expect(403);
  });

  it('should return 404 for missing agent and ticket', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const createResponse = await adminApi
      .post('/api/v1/tickets')
      .send({
        title: 'Validation ticket',
        description: 'Ticket for validation tests',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await adminApi
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ agentId: '00000000-0000-4000-8000-000000000099' })
      .expect(404);

    await adminApi
      .patch('/api/v1/tickets/00000000-0000-4000-8000-000000000099/assign')
      .send({ agentId: fixtures.agentA.id })
      .expect(404);
  });

  it('should reject assignment on closed ticket', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'ASSIGN-CLOSED',
        title: 'Closed ticket',
        description: 'Closed ticket assignment test',
        status: TicketStatus.CLOSED,
        customerId: fixtures.customerA.id,
        closedAt: new Date(),
      },
    });

    await adminApi
      .patch(`/api/v1/tickets/${ticket.id}/assign`)
      .send({ agentId: fixtures.agentA.id })
      .expect(400);
  });

  it('should list my-queue for authenticated agent', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );
    const agentApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.agentA.id,
        email: fixtures.agentA.email,
        role: UserRole.AGENT,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const createResponse = await adminApi
      .post('/api/v1/tickets')
      .send({
        title: 'My queue ticket',
        description: 'Ticket assigned to agent queue',
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    const queueResponse = await agentApi
      .get('/api/v1/tickets/my-queue')
      .expect(200);

    expect(queueResponse.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(
      queueResponse.body.data.some(
        (item: { id: string }) => item.id === ticketId,
      ),
    ).toBe(true);
  });

  it('should list unassigned tickets for supervisor', async () => {
    const fixtures = await seedIntegrationFixtures();
    const supervisorApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.SUPERVISOR,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const createResponse = await supervisorApi
      .post('/api/v1/tickets')
      .send({
        title: 'Unassigned queue ticket',
        description: 'Ticket without assignee',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    const unassignedResponse = await supervisorApi
      .get('/api/v1/tickets/unassigned')
      .expect(200);

    expect(
      unassignedResponse.body.data.some(
        (item: { id: string }) => item.id === ticketId,
      ),
    ).toBe(true);
  });

  it('should return agent metrics for supervisor', async () => {
    const fixtures = await seedIntegrationFixtures();

    await prisma.ticket.createMany({
      data: [
        {
          tenantId: fixtures.tenantA.id,
          protocol: 'METRICS-OPEN',
          title: 'Open assigned',
          description: 'Metrics open ticket',
          status: TicketStatus.OPEN,
          customerId: fixtures.customerA.id,
          assignedToId: fixtures.agentA.id,
        },
        {
          tenantId: fixtures.tenantA.id,
          protocol: 'METRICS-RESOLVED',
          title: 'Resolved assigned',
          description: 'Metrics resolved ticket',
          status: TicketStatus.RESOLVED,
          customerId: fixtures.customerA.id,
          assignedToId: fixtures.agentA.id,
          closedAt: new Date(),
        },
      ],
    });

    const supervisorApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.SUPERVISOR,
        tenantId: fixtures.tenantA.id,
      }),
    );

    const metricsResponse = await supervisorApi
      .get('/api/v1/metrics/agents')
      .expect(200);

    const agentMetrics = metricsResponse.body.data.agents.find(
      (item: { agentId: string }) => item.agentId === fixtures.agentA.id,
    );

    expect(agentMetrics).toMatchObject({
      agentName: fixtures.agentA.name,
      assignedTickets: 2,
      resolvedTickets: 1,
      openTickets: 1,
    });
  });
});
