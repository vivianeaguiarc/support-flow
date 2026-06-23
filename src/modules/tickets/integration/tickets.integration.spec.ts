import { TicketHistoryEvent, TicketStatus, UserRole } from '@prisma/client';
import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
  login,
} from '../../../test/integration/http-client.js';

describe.sequential('Ticket workflow integration', () => {
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

  it('runs the full ticket workflow end-to-end', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const createResponse = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Integration ticket',
        description: 'Ticket created during integration testing',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
        categoryId: fixtures.categoryA.id,
      })
      .expect(201);

    expect(createResponse.body.status).toBe(TicketStatus.OPEN);
    expect(createResponse.body.tenantId).toBe(fixtures.tenantA.id);
    expect(createResponse.body.protocol).toMatch(/^SF-\d{8}-[A-Z0-9]{6}$/);

    const ticketId = createResponse.body.id as string;

    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    await authRequest(app, agentBToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Other tenant ticket',
        description: 'Ticket that must not appear in tenant A listing',
        customerId: fixtures.customerB.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const listResponse = await api.get('/api/v1/tickets').expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(ticketId);
    expect(listResponse.body[0].tenantId).toBe(fixtures.tenantA.id);

    const findResponse = await api
      .get(`/api/v1/tickets/${ticketId}`)
      .expect(200);

    expect(findResponse.body.id).toBe(ticketId);
    expect(findResponse.body.tenantId).toBe(fixtures.tenantA.id);

    const transitionsResponse = await api
      .get(`/api/v1/tickets/${ticketId}/transitions`)
      .expect(200);

    expect(transitionsResponse.body.currentStatus).toBe(TicketStatus.OPEN);
    expect(transitionsResponse.body.allowedTransitions).toContain(
      TicketStatus.IN_PROGRESS,
    );

    const blockedInProgressResponse = await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(400);

    expect(blockedInProgressResponse.body.message).toBe(
      'Ticket must be assigned before moving to IN_PROGRESS.',
    );

    const assignResponse = await api
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ assignedToId: fixtures.agentA.id })
      .expect(200);

    expect(assignResponse.body.assignedToId).toBe(fixtures.agentA.id);

    const inProgressResponse = await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    expect(inProgressResponse.body.status).toBe(TicketStatus.IN_PROGRESS);

    const historyResponse = await api
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(200);

    expect(historyResponse.body.ticketId).toBe(ticketId);
    expect(historyResponse.body.history.length).toBeGreaterThanOrEqual(3);

    const actions = historyResponse.body.history.map(
      (entry: { action: string }) => entry.action,
    );

    expect(actions).toContain(TicketHistoryEvent.CREATED);
    expect(actions).toContain(TicketHistoryEvent.ASSIGNED);
    expect(actions).toContain(TicketHistoryEvent.STATUS_CHANGED);

    const statusChange = historyResponse.body.history.find(
      (entry: { action: string; newValue: string }) =>
        entry.action === TicketHistoryEvent.STATUS_CHANGED &&
        entry.newValue === TicketStatus.IN_PROGRESS,
    );

    expect(statusChange).toMatchObject({
      previousValue: TicketStatus.OPEN,
      performedById: fixtures.agentA.id,
      performedBy: {
        name: fixtures.agentA.name,
        email: fixtures.agentA.email,
      },
    });

    const assignHistory = historyResponse.body.history.find(
      (entry: { action: string }) =>
        entry.action === TicketHistoryEvent.ASSIGNED,
    );

    expect(assignHistory).toMatchObject({
      newValue: fixtures.agentA.id,
      performedById: fixtures.agentA.id,
    });
  });

  it('blocks access to tickets from another tenant', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentAToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const agentBToken = createAuthToken({
      id: fixtures.agentB.id,
      email: fixtures.agentB.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantB.id,
    });

    const createResponse = await authRequest(app, agentAToken)
      .post('/api/v1/tickets')
      .send({
        title: 'Tenant A ticket',
        description: 'Ticket isolated by tenant',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const ticketId = createResponse.body.id as string;

    const forbiddenResponse = await authRequest(app, agentBToken)
      .get(`/api/v1/tickets/${ticketId}`)
      .expect(404);

    expect(forbiddenResponse.body.message).toBe('Ticket not found');
  });

  it('blocks invalid status transitions', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const api = authRequest(app, agentToken);

    const createResponse = await api
      .post('/api/v1/tickets')
      .send({
        title: 'Transition validation ticket',
        description: 'Ticket used to validate status transitions',
        customerId: fixtures.customerA.id,
        priority: 'MEDIUM',
      })
      .expect(201);

    const ticketId = createResponse.body.id as string;

    await api
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ assignedToId: fixtures.agentA.id })
      .expect(200);

    await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.RESOLVED })
      .expect(200);

    const resolvedToOpenResponse = await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.OPEN })
      .expect(400);

    expect(resolvedToOpenResponse.body.message).toBe(
      'Invalid status transition from RESOLVED to OPEN',
    );

    await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.CLOSED })
      .expect(200);

    const closedToInProgressResponse = await api
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(400);

    expect(closedToInProgressResponse.body.message).toBe(
      'Invalid status transition from CLOSED to IN_PROGRESS',
    );
  });
});
