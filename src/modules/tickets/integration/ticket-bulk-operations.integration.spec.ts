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
  type IntegrationFixtures,
  seedIntegrationFixtures,
} from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { TicketHistoryEvent, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket bulk operations', () => {
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

  function adminApi(fixtures: IntegrationFixtures) {
    return authRequest(
      app,
      createAuthToken({
        id: fixtures.adminA.id,
        email: fixtures.adminA.email,
        role: UserRole.ADMIN,
        tenantId: fixtures.tenantA.id,
      }),
    );
  }

  async function createTicket(
    fixtures: IntegrationFixtures,
    title: string,
  ): Promise<string> {
    const response = await adminApi(fixtures)
      .post('/api/v1/tickets')
      .send({
        title,
        description: 'Ticket for bulk operations tests',
        customerId: fixtures.customerA.id,
      })
      .expect(201);

    return response.body.data.id as string;
  }

  it('updates status of multiple tickets atomically and records history', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId1 = await createTicket(fixtures, 'Bulk status ticket 1');
    const ticketId2 = await createTicket(fixtures, 'Bulk status ticket 2');

    const response = await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/status')
      .send({
        ticketIds: [ticketId1, ticketId2],
        status: TicketStatus.ESCALATED,
        reason: 'Escalado em lote pela supervisão',
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      totalRequested: 2,
      totalUpdated: 2,
      operation: 'bulk_status_update',
    });
    expect(response.body.data.updatedTicketIds).toEqual(
      expect.arrayContaining([ticketId1, ticketId2]),
    );

    const tickets = await prisma.ticket.findMany({
      where: { id: { in: [ticketId1, ticketId2] } },
    });
    expect(tickets.every((t) => t.status === TicketStatus.ESCALATED)).toBe(
      true,
    );

    const history = await prisma.ticketHistory.findMany({
      where: {
        ticketId: { in: [ticketId1, ticketId2] },
        event: TicketHistoryEvent.STATUS_CHANGED,
      },
    });
    expect(history).toHaveLength(2);
    expect(history[0].metadata).toMatchObject({
      reason: 'Escalado em lote pela supervisão',
    });
  });

  it('assigns multiple tickets atomically and records history', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId1 = await createTicket(fixtures, 'Bulk assign ticket 1');
    const ticketId2 = await createTicket(fixtures, 'Bulk assign ticket 2');

    const response = await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/assign')
      .send({
        ticketIds: [ticketId1, ticketId2],
        assignedToId: fixtures.agentA.id,
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      totalRequested: 2,
      totalUpdated: 2,
      operation: 'bulk_assign',
    });

    const tickets = await prisma.ticket.findMany({
      where: { id: { in: [ticketId1, ticketId2] } },
    });
    expect(tickets.every((t) => t.assignedToId === fixtures.agentA.id)).toBe(
      true,
    );

    const history = await prisma.ticketHistory.findMany({
      where: {
        ticketId: { in: [ticketId1, ticketId2] },
        event: TicketHistoryEvent.ASSIGNED,
      },
    });
    expect(history).toHaveLength(2);
  });

  it('rejects an empty ticketIds array with 400', async () => {
    const fixtures = await seedIntegrationFixtures();

    await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/status')
      .send({ ticketIds: [], status: TicketStatus.ESCALATED })
      .expect(400);
  });

  it('returns 404 when a ticket does not exist', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId = await createTicket(fixtures, 'Bulk 404 ticket');

    await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/status')
      .send({
        ticketIds: [ticketId, '00000000-0000-4000-8000-000000000099'],
        status: TicketStatus.ESCALATED,
      })
      .expect(404);

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    expect(ticket?.status).toBe(TicketStatus.OPEN);
  });

  it('returns 404 when a ticket belongs to another tenant', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ownTicket = await createTicket(fixtures, 'Own tenant ticket');

    const foreignTicket = await prisma.ticket.create({
      data: {
        tenantId: fixtures.tenantB.id,
        protocol: 'BULK-FOREIGN',
        title: 'Foreign tenant ticket',
        description: 'Belongs to another tenant',
        status: TicketStatus.OPEN,
        customerId: fixtures.customerB.id,
      },
    });

    await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/status')
      .send({
        ticketIds: [ownTicket, foreignTicket.id],
        status: TicketStatus.ESCALATED,
      })
      .expect(404);

    const untouched = await prisma.ticket.findUnique({
      where: { id: ownTicket },
    });
    expect(untouched?.status).toBe(TicketStatus.OPEN);
  });

  it('returns 409 and rolls back on invalid status transition', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId1 = await createTicket(fixtures, 'Rollback ticket 1');
    const ticketId2 = await createTicket(fixtures, 'Rollback ticket 2');

    await adminApi(fixtures)
      .patch('/api/v1/tickets/bulk/status')
      .send({
        ticketIds: [ticketId1, ticketId2],
        status: TicketStatus.CLOSED,
      })
      .expect(409);

    const tickets = await prisma.ticket.findMany({
      where: { id: { in: [ticketId1, ticketId2] } },
    });
    expect(tickets.every((t) => t.status === TicketStatus.OPEN)).toBe(true);

    const history = await prisma.ticketHistory.findMany({
      where: {
        ticketId: { in: [ticketId1, ticketId2] },
        event: TicketHistoryEvent.STATUS_CHANGED,
      },
    });
    expect(history).toHaveLength(0);
  });

  it('forbids customers from bulk status updates', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId = await createTicket(fixtures, 'RBAC status ticket');

    const customerApi = authRequest(
      app,
      createAuthToken({
        id: fixtures.customerA.id,
        email: fixtures.customerA.email,
        role: UserRole.CUSTOMER,
        tenantId: fixtures.tenantA.id,
      }),
    );

    await customerApi
      .patch('/api/v1/tickets/bulk/status')
      .send({ ticketIds: [ticketId], status: TicketStatus.ESCALATED })
      .expect(403);
  });

  it('forbids agents from bulk assignment', async () => {
    const fixtures = await seedIntegrationFixtures();
    const ticketId = await createTicket(fixtures, 'RBAC assign ticket');

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
      .patch('/api/v1/tickets/bulk/assign')
      .send({ ticketIds: [ticketId], assignedToId: fixtures.agentA.id })
      .expect(403);
  });
});
