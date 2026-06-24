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
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
  login,
} from '../../../test/integration/http-client.js';
import { TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket listing filters integration', () => {
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

  it('filters tickets by status, priority, assignment and search', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const openHighResponse = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Billing issue alpha',
        description: 'Open high priority billing ticket',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
        categoryId: fixtures.categoryA.id,
      })
      .expect(201);

    await api
      .post('/api/v1/tickets')
      .send({
        title: 'General support',
        description: 'Open medium priority general ticket',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const assignedResponse = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Assigned ticket',
        description: 'Ticket assigned to agent for filter test',
        customerId: fixtures.customerA.id,
        priority: 'LOW',
        assignedToId: fixtures.agentA.id,
      })
      .expect(201);

    const statusFiltered = await api
      .get('/api/v1/tickets')
      .query({ status: TicketStatus.OPEN, priority: 'HIGH' })
      .expect(200);

    expect(statusFiltered.body.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(statusFiltered.body.data).toHaveLength(1);
    expect(statusFiltered.body.data[0].id).toBe(openHighResponse.body.data.id);

    const unassignedFiltered = await api
      .get('/api/v1/tickets')
      .query({ unassigned: 'true' })
      .expect(200);

    expect(unassignedFiltered.body.meta.total).toBe(2);
    expect(unassignedFiltered.body.data).toHaveLength(2);
    expect(
      unassignedFiltered.body.data.every(
        (ticket: { assignedToId: string | null }) =>
          ticket.assignedToId === null,
      ),
    ).toBe(true);

    const assignedFiltered = await api
      .get('/api/v1/tickets')
      .query({ assignedToId: fixtures.agentA.id })
      .expect(200);

    expect(assignedFiltered.body.meta.total).toBe(1);
    expect(assignedFiltered.body.data).toHaveLength(1);
    expect(assignedFiltered.body.data[0].id).toBe(
      assignedResponse.body.data.id,
    );

    const assignedToAliasFiltered = await api
      .get('/api/v1/tickets')
      .query({ assignedTo: fixtures.agentA.id })
      .expect(200);

    expect(assignedToAliasFiltered.body.meta.total).toBe(1);
    expect(assignedToAliasFiltered.body.data[0].id).toBe(
      assignedResponse.body.data.id,
    );

    const searchFiltered = await api
      .get('/api/v1/tickets')
      .query({ search: 'billing issue' })
      .expect(200);

    expect(searchFiltered.body.meta.total).toBe(1);
    expect(searchFiltered.body.data).toHaveLength(1);
    expect(searchFiltered.body.data[0].title).toBe('Billing issue alpha');
  });

  it('filters overdue tickets and keeps tenant isolation', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const overdueResponse = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Overdue ticket',
        description: 'Ticket with expired SLA',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: overdueResponse.body.data.id as string },
      data: {
        slaDueAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });

    await api
      .post('/api/v1/tickets')
      .send({
        title: 'On time ticket',
        description: 'Ticket still within SLA',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    await authRequest(app, agentBToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Other tenant overdue',
        description: 'Must not leak into tenant A overdue filter',
        customerId: fixtures.customerB.id,
        priority: 'HIGH',
      })
      .expect(201);

    const overdueFiltered = await api
      .get('/api/v1/tickets')
      .query({ overdue: 'true' })
      .expect(200);

    expect(overdueFiltered.body.meta).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(overdueFiltered.body.data).toHaveLength(1);
    expect(overdueFiltered.body.data[0].id).toBe(overdueResponse.body.data.id);
    expect(overdueFiltered.body.data[0].tenantId).toBe(fixtures.tenantA.id);
  });

  it('returns pagination metadata and respects page and limit', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    for (let index = 0; index < 3; index += 1) {
      await api
        .post('/api/v1/tickets')
        .send({
          title: `Pagination ticket ${index + 1}`,
          description: 'Ticket used to validate pagination metadata',
          customerId: fixtures.customerA.id,
          priority: 'MEDIUM',
        })
        .expect(201);
    }

    const pageOne = await api
      .get('/api/v1/tickets')
      .query({ page: 1, limit: 2 })
      .expect(200);

    expect(pageOne.body.meta).toMatchObject({
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(pageOne.body.data).toHaveLength(2);

    const pageTwo = await api
      .get('/api/v1/tickets')
      .query({ page: 2, limit: 2 })
      .expect(200);

    expect(pageTwo.body.meta).toMatchObject({
      total: 3,
      page: 2,
      limit: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(pageTwo.body.data).toHaveLength(1);
  });

  it('rejects limit above the maximum allowed value', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken)
      .get('/api/v1/tickets')
      .query({ limit: 101 })
      .expect(400);
  });
});
