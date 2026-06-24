import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { createAuthToken } from '../../../test/integration/http-client.js';
import {
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../domain/ticket-enums.js';

describe.sequential('Ticket Routing', () => {
  const app = createApp();
  let tenantId: string;
  let adminId: string;
  let agent1Id: string;
  let agent2Id: string;
  let customerId: string;
  let adminToken: string;
  let categoryOuvidoriaId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Routing', slug: 'tenant-routing' },
    });
    tenantId = tenant.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin-routing@test.com',
        name: 'Admin Routing',
        password: 'password',
        role: UserRole.ADMIN,
        tenantId,
      },
    });
    adminId = admin.id;
    adminToken = createAuthToken(admin);

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-routing@test.com',
        name: 'Agent 1 Routing',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent1Id = agent1.id;

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-routing@test.com',
        name: 'Agent 2 Routing',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent2Id = agent2.id;

    const customer = await prisma.customer.create({
      data: {
        email: 'customer-routing@test.com',
        name: 'Customer Routing',
        tenantId,
      },
    });
    customerId = customer.id;

    const categoryOuvidoria = await prisma.ticketCategory.create({
      data: {
        tenantId,
        name: 'Ouvidoria',
        description: 'Categoria de ouvidoria',
      },
    });
    categoryOuvidoriaId = categoryOuvidoria.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('POST /tickets/:id/route', () => {
    it('should route URGENT ticket to ADMIN preferentially', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-001',
          title: 'Urgent issue',
          description: 'Critical problem',
          status: TicketStatus.OPEN,
          priority: TicketPriority.URGENT,
          customerId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.routedTo.id).toBe(adminId);
      expect(response.body.data.routedTo.role).toBe(UserRole.ADMIN);
      expect(response.body.data.reason).toContain('URGENT');

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(updatedTicket?.assignedToId).toBe(adminId);
    });

    it('should route ombudsman category ticket to ADMIN', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-002',
          title: 'Ombudsman complaint',
          description: 'Need specialized handling',
          status: TicketStatus.OPEN,
          priority: TicketPriority.MEDIUM,
          categoryId: categoryOuvidoriaId,
          customerId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.routedTo.id).toBe(adminId);
      expect(response.body.data.reason).toContain('Ouvidoria');
    });

    it('should route to agent with least workload as fallback', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'ROUTE-LOAD-1',
            title: 'Existing ticket 1',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            priority: TicketPriority.LOW,
            customerId,
            assignedToId: agent1Id,
          },
          {
            tenantId,
            protocol: 'ROUTE-LOAD-2',
            title: 'Existing ticket 2',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            priority: TicketPriority.LOW,
            customerId,
            assignedToId: agent1Id,
          },
        ],
      });

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-003',
          title: 'Regular ticket',
          description: 'Standard priority',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.routedTo.id).toBe(agent2Id);
      expect(response.body.data.reason).toContain('menor carga');
    });

    it('should create history entry for routing', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-004',
          title: 'History test',
          description: 'Test',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const history = await prisma.ticketHistory.findFirst({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.ASSIGNED,
        },
      });

      expect(history).toBeDefined();
      expect(history?.field).toBe('assignedToId');
      expect(history?.newValue).toBeDefined();
      expect(history?.changedById).toBe(adminId);
    });

    it('should create notification for routed agent', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-005',
          title: 'Notification test',
          description: 'Test',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      const notification = await prisma.notification.findFirst({
        where: {
          ticketId: ticket.id,
          recipientId: updatedTicket?.assignedToId ?? undefined,
        },
      });

      expect(notification).toBeDefined();
    });

    it('should not route RESOLVED tickets', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-006',
          title: 'Resolved ticket',
          description: 'Test',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should not route CLOSED tickets', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-007',
          title: 'Closed ticket',
          description: 'Test',
          status: TicketStatus.CLOSED,
          priority: TicketPriority.LOW,
          customerId,
          closedAt: new Date(),
        },
      });

      await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should respect tenant isolation', async () => {
      const tenant2 = await prisma.tenant.create({
        data: { name: 'Tenant 2', slug: 'tenant-2-routing' },
      });

      const customer2 = await prisma.customer.create({
        data: {
          email: 'customer2-routing@test.com',
          name: 'Customer 2',
          tenantId: tenant2.id,
        },
      });

      const ticket = await prisma.ticket.create({
        data: {
          tenantId: tenant2.id,
          protocol: 'ROUTE-008',
          title: 'Other tenant ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId: customer2.id,
        },
      });

      await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app)
        .post('/api/v1/tickets/00000000-0000-0000-0000-000000000000/route')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should prefer ADMIN over AGENT for equal workload', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-009',
          title: 'Priority test',
          description: 'Test',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect([adminId, agent1Id, agent2Id]).toContain(
        response.body.data.routedTo.id,
      );
    });

    it('should re-route already assigned ticket', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ROUTE-010',
          title: 'Re-route test',
          description: 'Test',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.LOW,
          customerId,
          assignedToId: agent1Id,
        },
      });

      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'ROUTE-LOAD-3',
            title: 'Load for agent1',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            priority: TicketPriority.LOW,
            customerId,
            assignedToId: agent1Id,
          },
          {
            tenantId,
            protocol: 'ROUTE-LOAD-4',
            title: 'Load for agent1 2',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            priority: TicketPriority.LOW,
            customerId,
            assignedToId: agent1Id,
          },
        ],
      });

      const response = await request(app)
        .post(`/api/v1/tickets/${ticket.id}/route`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.routedTo.id).not.toBe(agent1Id);

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.REASSIGNED,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(history.length).toBeGreaterThan(0);
      const lastHistory = history[history.length - 1];
      expect(lastHistory.oldValue).toBe(agent1Id);
      expect(lastHistory.newValue).toBe(response.body.data.routedTo.id);
    });
  });
});
