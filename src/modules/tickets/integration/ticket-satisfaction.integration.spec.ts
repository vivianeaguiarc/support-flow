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
import {
  TicketHistoryEvent,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

describe.sequential('Ticket satisfaction surveys integration', () => {
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

  it('should allow customer to submit satisfaction for resolved ticket', async () => {
    const fixtures = await seedIntegrationFixtures();

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'SF-CSAT-000001',
        title: 'Resolved ticket',
        description: 'Ticket for CSAT',
        status: TicketStatus.RESOLVED,
        priority: 'MEDIUM',
        customerId: fixtures.customerA.id,
        assignedToId: fixtures.agentA.id,
      },
    });

    const customerToken = createAuthToken({
      id: fixtures.customerA.id,
      email: fixtures.customerA.email,
      role: UserRole.CUSTOMER,
      tenantId: fixtures.tenantA.id,
    });

    const response = await authRequest(app, customerToken)
      .post(`/api/v1/tickets/${ticket.id}/satisfaction`)
      .send({ rating: 5, comment: 'Excelente atendimento' })
      .expect(201);

    expect(response.body.data).toMatchObject({
      ticketId: ticket.id,
      customerId: fixtures.customerA.id,
      rating: 5,
      comment: 'Excelente atendimento',
    });

    const history = await prisma.ticketHistory.findMany({
      where: {
        ticketId: ticket.id,
        event: TicketHistoryEvent.SATISFACTION_SUBMITTED,
      },
    });

    expect(history).toHaveLength(1);
    expect(history[0]?.newValue).toBe('5');
  });

  it('should reject duplicate satisfaction submission', async () => {
    const fixtures = await seedIntegrationFixtures();

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'SF-CSAT-000002',
        title: 'Closed ticket',
        description: 'Ticket for CSAT duplicate',
        status: TicketStatus.CLOSED,
        priority: 'LOW',
        customerId: fixtures.customerA.id,
      },
    });

    const customerToken = createAuthToken({
      id: fixtures.customerA.id,
      email: fixtures.customerA.email,
      role: UserRole.CUSTOMER,
      tenantId: fixtures.tenantA.id,
    });
    const customerApi = authRequest(app, customerToken);

    await customerApi
      .post(`/api/v1/tickets/${ticket.id}/satisfaction`)
      .send({ rating: 4 })
      .expect(201);

    await customerApi
      .post(`/api/v1/tickets/${ticket.id}/satisfaction`)
      .send({ rating: 3 })
      .expect(409);
  });

  it('should reject satisfaction for open ticket and foreign ticket', async () => {
    const fixtures = await seedIntegrationFixtures();

    const openTicket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'SF-CSAT-000003',
        title: 'Open ticket',
        description: 'Not eligible',
        status: TicketStatus.OPEN,
        priority: 'MEDIUM',
        customerId: fixtures.customerA.id,
      },
    });

    const otherTicket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'SF-CSAT-000004',
        title: 'Other customer ticket',
        description: 'Foreign',
        status: TicketStatus.RESOLVED,
        priority: 'MEDIUM',
        customerId: fixtures.customerB.id,
      },
    });

    const customerToken = createAuthToken({
      id: fixtures.customerA.id,
      email: fixtures.customerA.email,
      role: UserRole.CUSTOMER,
      tenantId: fixtures.tenantA.id,
    });
    const customerApi = authRequest(app, customerToken);

    await customerApi
      .post(`/api/v1/tickets/${openTicket.id}/satisfaction`)
      .send({ rating: 5 })
      .expect(400);

    await customerApi
      .post(`/api/v1/tickets/${otherTicket.id}/satisfaction`)
      .send({ rating: 5 })
      .expect(403);
  });

  it('should forbid agent from submitting satisfaction', async () => {
    const fixtures = await seedIntegrationFixtures();

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantA.id,
        protocol: 'SF-CSAT-000005',
        title: 'Resolved',
        description: 'Agent forbidden',
        status: TicketStatus.RESOLVED,
        priority: 'MEDIUM',
        customerId: fixtures.customerA.id,
      },
    });

    const agentToken = createAuthToken({
      id: fixtures.agentA.id,
      email: fixtures.agentA.email,
      role: UserRole.AGENT,
      tenantId: fixtures.tenantA.id,
    });

    await authRequest(app, agentToken)
      .post(`/api/v1/tickets/${ticket.id}/satisfaction`)
      .send({ rating: 5 })
      .expect(403);
  });
});
