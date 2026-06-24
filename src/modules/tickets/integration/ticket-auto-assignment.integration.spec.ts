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
import { TicketHistoryEvent, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket Auto-Assignment', () => {
  const app = createApp();
  let tenantId: string;
  let agent1Id: string;
  let agent2Id: string;
  let agent3Id: string;
  let customer1Id: string;
  let adminToken: string;
  let agent1Token: string;

  beforeAll(async () => {
    await migrateTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Auto-Assign', slug: 'tenant-auto-assign' },
    });
    tenantId = tenant.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin-aa@test.com',
        name: 'Admin Auto-Assign',
        password: 'password',
        role: UserRole.ADMIN,
        tenantId,
      },
    });
    adminToken = createAuthToken(admin);

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-aa@test.com',
        name: 'Agent 1 AA',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent1Id = agent1.id;
    agent1Token = createAuthToken(agent1);

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-aa@test.com',
        name: 'Agent 2 AA',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent2Id = agent2.id;

    const agent3 = await prisma.user.create({
      data: {
        email: 'agent3-aa@test.com',
        name: 'Agent 3 AA',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent3Id = agent3.id;

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-aa@test.com',
        name: 'Customer 1 AA',
        tenantId,
      },
    });
    customer1Id = customer1.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('POST /tickets/auto-assign', () => {
    it('should assign unassigned ticket to agent with least workload', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-001',
          title: 'Unassigned ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(1);
      expect(response.body.data.ticketsAssigned).toBe(1);
      expect(response.body.data.failedAssignments).toBe(0);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(updatedTicket?.assignedToId).not.toBeNull();
    });

    it('should distribute tickets evenly among agents', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'AA-002',
            title: 'Ticket 1',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
          },
          {
            tenantId,
            protocol: 'AA-003',
            title: 'Ticket 2',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
          },
          {
            tenantId,
            protocol: 'AA-004',
            title: 'Ticket 3',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
          },
        ],
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsAssigned).toBe(3);

      const assignedTickets = await prisma.ticket.findMany({
        where: {
          protocol: { in: ['AA-002', 'AA-003', 'AA-004'] },
        },
        select: { assignedToId: true },
      });

      const uniqueAgents = new Set(assignedTickets.map((t) => t.assignedToId));

      expect(uniqueAgents.size).toBeGreaterThan(1);
    });

    it('should prefer agent with least active tickets', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'AA-010',
            title: 'Existing ticket 1',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            customerId: customer1Id,
            assignedToId: agent1Id,
          },
          {
            tenantId,
            protocol: 'AA-011',
            title: 'Existing ticket 2',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            customerId: customer1Id,
            assignedToId: agent1Id,
          },
        ],
      });

      const newTicket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-012',
          title: 'New unassigned ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: newTicket.id },
      });

      expect(updatedTicket?.assignedToId).not.toBe(agent1Id);
      expect([agent2Id, agent3Id]).toContain(updatedTicket?.assignedToId);
    });

    it('should count only active tickets for workload calculation', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'AA-015',
            title: 'Active ticket',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
          },
          {
            tenantId,
            protocol: 'AA-016',
            title: 'Resolved ticket',
            description: 'Test',
            status: TicketStatus.RESOLVED,
            customerId: customer1Id,
            assignedToId: agent1Id,
          },
          {
            tenantId,
            protocol: 'AA-017',
            title: 'Closed ticket',
            description: 'Test',
            status: TicketStatus.CLOSED,
            customerId: customer1Id,
            assignedToId: agent1Id,
          },
        ],
      });

      const newTicket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-018',
          title: 'New ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: newTicket.id },
      });

      expect(updatedTicket?.assignedToId).toBeDefined();
    });

    it('should NOT assign already assigned tickets', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-020',
          title: 'Already assigned',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
        },
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(0);
      expect(response.body.data.ticketsAssigned).toBe(0);

      const unchangedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(unchangedTicket?.assignedToId).toBe(agent1Id);
    });

    it('should NOT assign non-OPEN tickets', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'AA-025',
            title: 'In Progress',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            customerId: customer1Id,
          },
          {
            tenantId,
            protocol: 'AA-026',
            title: 'Resolved',
            description: 'Test',
            status: TicketStatus.RESOLVED,
            customerId: customer1Id,
          },
          {
            tenantId,
            protocol: 'AA-027',
            title: 'Closed',
            description: 'Test',
            status: TicketStatus.CLOSED,
            customerId: customer1Id,
          },
        ],
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(0);
      expect(response.body.data.ticketsAssigned).toBe(0);
    });

    it('should create history entry for assignment', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-030',
          title: 'History test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      await request(app)
        .post('/api/v1/tickets/auto-assign')
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
      expect(history?.oldValue).toBeNull();
      expect(history?.newValue).toBeDefined();
      expect(history?.changedById).toBeNull();
    });

    it('should create notification for assigned agent', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-035',
          title: 'Notification test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      await request(app)
        .post('/api/v1/tickets/auto-assign')
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
      expect(notification?.title).toContain('atribuído');
    });

    it('should respect tenant isolation', async () => {
      const tenant2 = await prisma.tenant.create({
        data: { name: 'Tenant 2', slug: 'tenant-2-aa' },
      });

      await prisma.user.create({
        data: {
          email: 'agent-tenant2-aa@test.com',
          name: 'Agent Tenant 2',
          password: 'password',
          role: UserRole.AGENT,
          tenantId: tenant2.id,
        },
      });

      const customer2Tenant = await prisma.customer.create({
        data: {
          email: 'customer-tenant2-aa@test.com',
          name: 'Customer Tenant 2',
          tenantId: tenant2.id,
        },
      });

      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'AA-040',
            title: 'Tenant 1 ticket',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
          },
          {
            tenantId: tenant2.id,
            protocol: 'AA-041',
            title: 'Tenant 2 ticket',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer2Tenant.id,
          },
        ],
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(1);

      const tenant1Ticket = await prisma.ticket.findFirst({
        where: { protocol: 'AA-040' },
      });

      const tenant2Ticket = await prisma.ticket.findFirst({
        where: { protocol: 'AA-041' },
      });

      expect(tenant1Ticket?.assignedToId).toBeDefined();
      expect([agent1Id, agent2Id, agent3Id]).toContain(
        tenant1Ticket?.assignedToId,
      );

      expect(tenant2Ticket?.assignedToId).toBeNull();
    });

    it('should allow agent to trigger auto-assign', async () => {
      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-050',
          title: 'Agent trigger test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${agent1Token}`)
        .expect(200);

      expect(response.body.data.ticketsAssigned).toBe(1);
    });

    it('should return zero when no unassigned tickets exist', async () => {
      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(0);
      expect(response.body.data.ticketsAssigned).toBe(0);
      expect(response.body.data.failedAssignments).toBe(0);
    });

    it('should handle case with no available agents gracefully', async () => {
      await prisma.user.deleteMany({
        where: {
          tenantId,
          role: UserRole.AGENT,
        },
      });

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'AA-060',
          title: 'No agents available',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      const response = await request(app)
        .post('/api/v1/tickets/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.ticketsProcessed).toBe(1);
      expect(response.body.data.ticketsAssigned).toBe(0);
      expect(response.body.data.failedAssignments).toBe(1);
    });
  });
});
