import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { integrationPrisma } from '../../../test/integration/database.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import { authRequest, login } from '../../../test/integration/http-client.js';
import { TicketStatus } from '../domain/ticket-enums.js';
import { TicketSlaStatus } from '../domain/ticket-sla-status.js';

describe.sequential('Ticket SLA API integration', () => {
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

  it('returns SLA summary totals for active tickets', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const onTime = await api
      .post('/api/v1/tickets')
      .send({
        title: 'On time ticket',
        description: 'Ticket within SLA window',
        customerId: fixtures.customerA.id,
        priority: 'LOW',
      })
      .expect(201);

    const warning = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Warning ticket',
        description: 'Ticket close to SLA breach',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const breached = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Breached ticket',
        description: 'Ticket with expired SLA',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: warning.body.data.id as string },
      data: {
        slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    await integrationPrisma.ticket.update({
      where: { id: breached.body.data.id as string },
      data: {
        slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    await integrationPrisma.ticket.update({
      where: { id: onTime.body.data.id as string },
      data: {
        slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    const summaryResponse = await api.get('/api/v1/tickets/sla').expect(200);

    expect(summaryResponse.body.data).toEqual({
      onTime: 1,
      warning: 1,
      breached: 1,
      total: 3,
    });
  });

  it('lists only breached SLA tickets with pagination metadata', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const breached = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Breached only',
        description: 'Expired SLA ticket',
        customerId: fixtures.customerA.id,
        priority: 'URGENT',
      })
      .expect(201);

    await api
      .post('/api/v1/tickets')
      .send({
        title: 'Healthy ticket',
        description: 'Still within SLA',
        customerId: fixtures.customerA.id,
        priority: 'LOW',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: breached.body.data.id as string },
      data: {
        slaDueAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    const response = await api
      .get('/api/v1/tickets/sla/breached')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.meta.total).toBe(1);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: breached.body.data.id,
      slaStatus: TicketSlaStatus.BREACHED,
    });
    expect(response.body.data[0].hoursOverdue).toBeGreaterThanOrEqual(0);
  });

  it('excludes resolved and closed tickets from SLA summary', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const closedTicket = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Closed breached',
        description: 'Should not count in SLA summary',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: closedTicket.body.data.id as string },
      data: {
        status: TicketStatus.CLOSED,
        slaDueAt: new Date(Date.now() - 60 * 60 * 1000),
        closedAt: new Date(),
      },
    });

    const summaryResponse = await api.get('/api/v1/tickets/sla').expect(200);

    expect(summaryResponse.body.data.total).toBe(0);
  });
});
