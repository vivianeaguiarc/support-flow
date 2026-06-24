import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import {
  disconnectTestDatabase,
  integrationPrisma,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  getApiErrorMessage,
  login,
} from '../../../test/integration/http-client.js';

describe.sequential('Ticket listing sorting integration', () => {
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

  it('sorts tickets by createdAt asc and desc', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const oldest = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Oldest ticket',
        description: 'Ticket with earliest createdAt',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const middle = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Middle ticket',
        description: 'Ticket with middle createdAt',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const newest = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Newest ticket',
        description: 'Ticket with latest createdAt',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: oldest.body.data.id as string },
      data: { createdAt: new Date('2026-01-01T10:00:00.000Z') },
    });
    await integrationPrisma.ticket.update({
      where: { id: middle.body.data.id as string },
      data: { createdAt: new Date('2026-01-02T10:00:00.000Z') },
    });
    await integrationPrisma.ticket.update({
      where: { id: newest.body.data.id as string },
      data: { createdAt: new Date('2026-01-03T10:00:00.000Z') },
    });

    const ascResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'createdAt', sortOrder: 'asc' })
      .expect(200);

    expect(
      ascResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([oldest.body.data.id, middle.body.data.id, newest.body.data.id]);

    const descResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'createdAt', sortOrder: 'desc' })
      .expect(200);

    expect(
      descResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([newest.body.data.id, middle.body.data.id, oldest.body.data.id]);
  });

  it('sorts tickets by slaDueAt asc and desc', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const soon = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Soon SLA',
        description: 'Ticket with nearest SLA due date',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
      })
      .expect(201);

    const later = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Later SLA',
        description: 'Ticket with later SLA due date',
        customerId: fixtures.customerA.id,
        priority: 'LOW',
      })
      .expect(201);

    await integrationPrisma.ticket.update({
      where: { id: soon.body.data.id as string },
      data: { slaDueAt: new Date('2026-06-24T10:00:00.000Z') },
    });
    await integrationPrisma.ticket.update({
      where: { id: later.body.data.id as string },
      data: { slaDueAt: new Date('2026-06-30T10:00:00.000Z') },
    });

    const ascResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'slaDueAt', sortOrder: 'asc' })
      .expect(200);

    expect(
      ascResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([soon.body.data.id, later.body.data.id]);

    const descResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'slaDueAt', sortOrder: 'desc' })
      .expect(200);

    expect(
      descResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([later.body.data.id, soon.body.data.id]);
  });

  it('sorts tickets by priority', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const low = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Low priority ticket',
        description: 'Ticket with low priority',
        customerId: fixtures.customerA.id,
        priority: 'LOW',
      })
      .expect(201);

    const urgent = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Urgent priority ticket',
        description: 'Ticket with urgent priority',
        customerId: fixtures.customerA.id,
        priority: 'URGENT',
      })
      .expect(201);

    const ascResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'priority', sortOrder: 'asc' })
      .expect(200);

    expect(
      ascResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([low.body.data.id, urgent.body.data.id]);

    const descResponse = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'priority', sortOrder: 'desc' })
      .expect(200);

    expect(
      descResponse.body.data.map((ticket: { id: string }) => ticket.id),
    ).toEqual([urgent.body.data.id, low.body.data.id]);
  });

  it('rejects invalid sortBy and sortOrder query params', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const invalidSortBy = await api
      .get('/api/v1/tickets')
      .query({ sortBy: 'title' })
      .expect(400);

    expect(getApiErrorMessage(invalidSortBy.body)).toContain('sortBy');

    const invalidSortOrder = await api
      .get('/api/v1/tickets')
      .query({ sortOrder: 'invalid' })
      .expect(400);

    expect(getApiErrorMessage(invalidSortOrder.body)).toContain('sortOrder');
  });
});
