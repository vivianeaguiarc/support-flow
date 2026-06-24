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
import { slaMonitoringService } from '../application/services/sla-monitoring.service.js';
import { TicketHistoryEvent, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket History', () => {
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

  it('should record history automatically when ticket lifecycle changes', async () => {
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
        title: 'History audit ticket',
        description: 'Ticket for history tests',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    const adminApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );

    await adminApi
      .patch(`/api/v1/tickets/${ticketId}/assign`)
      .send({ agentId: fixtures.agentA.id })
      .expect(200);

    await agentApi
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    const historyResponse = await agentApi
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(200);

    const actions = historyResponse.body.data.history.map(
      (entry: { action: string }) => entry.action,
    );

    expect(actions).toContain(TicketHistoryEvent.CREATED);
    expect(actions).toContain(TicketHistoryEvent.ASSIGNED);
    expect(actions).toContain(TicketHistoryEvent.STATUS_CHANGED);

    const statusChange = historyResponse.body.data.history.find(
      (entry: { action: string; newValue: string }) =>
        entry.action === TicketHistoryEvent.STATUS_CHANGED &&
        entry.newValue === TicketStatus.IN_PROGRESS,
    );

    expect(statusChange).toMatchObject({
      ticketId,
      oldValue: TicketStatus.OPEN,
      actorId: fixtures.agentA.id,
    });
  });

  it('should list full history for staff via canonical ticketId route', async () => {
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
        title: 'Canonical history route',
        description: 'Route test',
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await agentApi
      .post(`/api/v1/tickets/${ticketId}/internal-comments`)
      .send({ content: 'Internal note for history' })
      .expect(201);

    const historyResponse = await agentApi
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(200);

    expect(historyResponse.body.data.ticketId).toBe(ticketId);

    const commentEvent = historyResponse.body.data.history.find(
      (entry: { action: string }) =>
        entry.action === TicketHistoryEvent.COMMENT_ADDED,
    );

    expect(commentEvent).toBeDefined();
    expect(commentEvent.metadata).toMatchObject({
      visibility: 'INTERNAL',
    });
    expect(commentEvent.metadata.commentId).toBeDefined();
  });

  it('should hide internal events from customer and expose only public events', async () => {
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
    const customerToken = createAuthToken({
      id: fixtures.customerA.id,
      email: fixtures.customerA.email,
      role: UserRole.CUSTOMER,
      tenantId: fixtures.tenantA.id,
    });
    const customerApi = authRequest(app, customerToken);

    const createResponse = await agentApi
      .post('/api/v1/tickets')
      .send({
        title: 'Customer history visibility',
        description: 'Visibility test',
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await agentApi
      .patch(`/api/v1/tickets/${ticketId}/status`)
      .send({ status: TicketStatus.IN_PROGRESS })
      .expect(200);

    await agentApi
      .post(`/api/v1/tickets/${ticketId}/internal-comments`)
      .send({ content: 'Hidden from customer' })
      .expect(201);

    const staffHistory = await agentApi
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(200);

    const customerHistory = await customerApi
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(200);

    expect(staffHistory.body.data.history.length).toBeGreaterThan(
      customerHistory.body.data.history.length,
    );

    const customerActions = customerHistory.body.data.history.map(
      (entry: { action: string }) => entry.action,
    );

    expect(customerActions).toEqual(
      expect.arrayContaining([
        TicketHistoryEvent.CREATED,
        TicketHistoryEvent.STATUS_CHANGED,
      ]),
    );
    expect(customerActions).not.toContain(TicketHistoryEvent.ASSIGNED);
    expect(customerActions).not.toContain(TicketHistoryEvent.COMMENT_ADDED);
  });

  it('should return 403 when customer accesses another customer ticket history', async () => {
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
    const otherCustomerToken = createAuthToken({
      id: fixtures.customerB.id,
      email: fixtures.customerB.email,
      role: UserRole.CUSTOMER,
      tenantId: fixtures.tenantB.id,
    });
    const otherCustomerApi = authRequest(app, otherCustomerToken);

    const createResponse = await agentApi
      .post('/api/v1/tickets')
      .send({
        title: 'Forbidden history access',
        description: 'Forbidden history access test',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    const ticketId = createResponse.body.data.id as string;

    await otherCustomerApi
      .get(`/api/v1/tickets/${ticketId}/history`)
      .expect(403);
  });

  it('should return 404 for nonexistent ticket history', async () => {
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

    await agentApi
      .get(`/api/v1/tickets/00000000-0000-4000-8000-000000000099/history`)
      .expect(404);
  });

  it('should record SLA_BREACHED event when SLA monitoring detects breach', async () => {
    const fixtures = await seedIntegrationFixtures();

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'HIST-SLA-001',
        title: 'SLA breach history',
        description: 'SLA history test',
        status: TicketStatus.OPEN,
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
        slaDueAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    });

    const result = await slaMonitoringService.checkSlaStatus();

    expect(result.slaBreachedHistoryCreated).toBeGreaterThanOrEqual(1);

    const slaHistory = await prisma.ticketHistory.findFirst({
      where: {
        ticketId: ticket.id,
        event: TicketHistoryEvent.SLA_BREACHED,
      },
    });

    expect(slaHistory).toBeDefined();
    expect(slaHistory?.metadata).toMatchObject({
      protocol: 'HIST-SLA-001',
    });
  });
});
