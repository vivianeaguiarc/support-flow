import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/database/prisma.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { ticketEscalationService } from '../application/services/ticket-escalation.service.js';
import { TicketHistoryEvent, TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket Escalation by SLA', () => {
  let tenantId: string;
  let agent1Id: string;
  let agent2Id: string;
  let customer1Id: string;

  beforeAll(async () => {
    await migrateTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Escalation', slug: 'tenant-escalation' },
    });
    tenantId = tenant.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-escalation@test.com',
        name: 'Agent 1 Escalation',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent1Id = agent1.id;

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-escalation@test.com',
        name: 'Agent 2 Escalation',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent2Id = agent2.id;

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-escalation@test.com',
        name: 'Customer 1 Escalation',
        tenantId,
      },
    });
    customer1Id = customer1.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('Automatic Escalation', () => {
    it('should escalate OPEN ticket with overdue SLA', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-001',
          title: 'Overdue open ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsChecked).toBe(1);
      expect(result.ticketsEscalated).toBe(1);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(updatedTicket?.status).toBe(TicketStatus.ESCALATED);
    });

    it('should escalate IN_PROGRESS ticket with overdue SLA', async () => {
      const slaDueAt = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-002',
          title: 'Overdue in progress ticket',
          description: 'Test',
          status: TicketStatus.IN_PROGRESS,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsEscalated).toBe(1);

      const updatedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(updatedTicket?.status).toBe(TicketStatus.ESCALATED);
    });

    it('should NOT escalate ticket with future SLA', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours future

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-003',
          title: 'Future SLA ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsChecked).toBe(0);
      expect(result.ticketsEscalated).toBe(0);
    });

    it('should NOT escalate RESOLVED ticket even with overdue SLA', async () => {
      const slaDueAt = new Date(Date.now() - 5 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-004',
          title: 'Resolved ticket',
          description: 'Test',
          status: TicketStatus.RESOLVED,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsChecked).toBe(0);
      expect(result.ticketsEscalated).toBe(0);

      const unchangedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(unchangedTicket?.status).toBe(TicketStatus.RESOLVED);
    });

    it('should NOT escalate CLOSED ticket even with overdue SLA', async () => {
      const slaDueAt = new Date(Date.now() - 5 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-005',
          title: 'Closed ticket',
          description: 'Test',
          status: TicketStatus.CLOSED,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsEscalated).toBe(0);

      const unchangedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(unchangedTicket?.status).toBe(TicketStatus.CLOSED);
    });

    it('should NOT escalate WAITING_CUSTOMER ticket with overdue SLA', async () => {
      const slaDueAt = new Date(Date.now() - 3 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-006',
          title: 'Waiting customer ticket',
          description: 'Test',
          status: TicketStatus.WAITING_CUSTOMER,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsEscalated).toBe(0);

      const unchangedTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
      });

      expect(unchangedTicket?.status).toBe(TicketStatus.WAITING_CUSTOMER);
    });
  });

  describe('History Recording', () => {
    it('should create TICKET_ESCALATED history entry', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-007',
          title: 'History test ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      await ticketEscalationService.escalateOverdueTickets();

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.TICKET_ESCALATED,
        },
      });

      expect(history).toHaveLength(1);
      expect(history[0].event).toBe(TicketHistoryEvent.TICKET_ESCALATED);
      expect(history[0].field).toBe('status');
      expect(history[0].oldValue).toBe(TicketStatus.OPEN);
      expect(history[0].newValue).toBe(TicketStatus.ESCALATED);
      expect(history[0].changedById).toBeNull();
    });

    it('should record previous status correctly in history', async () => {
      const slaDueAt = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-008',
          title: 'In progress escalation',
          description: 'Test',
          status: TicketStatus.IN_PROGRESS,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      await ticketEscalationService.escalateOverdueTickets();

      const history = await prisma.ticketHistory.findFirst({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.TICKET_ESCALATED,
        },
      });

      expect(history?.oldValue).toBe(TicketStatus.IN_PROGRESS);
      expect(history?.newValue).toBe(TicketStatus.ESCALATED);
    });
  });

  describe('Notification Creation', () => {
    it('should create notification for assigned agent', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-009',
          title: 'Notification test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      await ticketEscalationService.escalateOverdueTickets();

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
          recipientId: agent1Id,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);

      const escalationNotification = notifications.find((n) =>
        n.title.includes('escalado'),
      );

      expect(escalationNotification).toBeDefined();
      expect(escalationNotification?.message).toContain('ESC-009');
      expect(escalationNotification?.message).toContain(TicketStatus.OPEN);
    });

    it('should NOT create notification for unassigned ticket', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-010',
          title: 'Unassigned escalation',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          slaDueAt,
        },
      });

      await ticketEscalationService.escalateOverdueTickets();

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
        },
      });

      expect(notifications).toHaveLength(0);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should NOT re-escalate already ESCALATED ticket', async () => {
      const slaDueAt = new Date(Date.now() - 5 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-011',
          title: 'Already escalated',
          description: 'Test',
          status: TicketStatus.ESCALATED,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      await ticketEscalationService.escalateOverdueTickets();

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.TICKET_ESCALATED,
        },
      });

      expect(history).toHaveLength(0);
    });

    it('should escalate only once on multiple runs', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-012',
          title: 'Multiple runs test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      // First run
      const result1 = await ticketEscalationService.escalateOverdueTickets();
      expect(result1.ticketsEscalated).toBe(1);

      // Second run
      const result2 = await ticketEscalationService.escalateOverdueTickets();
      expect(result2.ticketsEscalated).toBe(0);

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.TICKET_ESCALATED,
        },
      });

      expect(history).toHaveLength(1);

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
        },
      });

      expect(notifications).toHaveLength(1);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should respect tenant boundaries', async () => {
      const tenant2 = await prisma.tenant.create({
        data: { name: 'Tenant 2', slug: 'tenant-2-esc' },
      });

      const agent2Tenant = await prisma.user.create({
        data: {
          email: 'agent-tenant2@test.com',
          name: 'Agent Tenant 2',
          password: 'password',
          role: UserRole.AGENT,
          tenantId: tenant2.id,
        },
      });

      const customer2Tenant = await prisma.customer.create({
        data: {
          email: 'customer-tenant2@test.com',
          name: 'Customer Tenant 2',
          tenantId: tenant2.id,
        },
      });

      const slaDueAt = new Date(Date.now() - 3 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'ESC-013',
          title: 'Tenant 1 ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      await prisma.ticket.create({
        data: {
          tenantId: tenant2.id,
          protocol: 'ESC-014',
          title: 'Tenant 2 ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer2Tenant.id,
          assignedToId: agent2Tenant.id,
          slaDueAt,
        },
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsChecked).toBe(2);
      expect(result.ticketsEscalated).toBe(2);

      const tenant1Escalated = await prisma.ticket.count({
        where: {
          tenantId,
          status: TicketStatus.ESCALATED,
        },
      });

      const tenant2Escalated = await prisma.ticket.count({
        where: {
          tenantId: tenant2.id,
          status: TicketStatus.ESCALATED,
        },
      });

      expect(tenant1Escalated).toBe(1);
      expect(tenant2Escalated).toBe(1);
    });
  });

  describe('Bulk Escalation', () => {
    it('should escalate multiple overdue tickets at once', async () => {
      const slaDueAt = new Date(Date.now() - 4 * 60 * 60 * 1000);

      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'ESC-015',
            title: 'Bulk ticket 1',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'ESC-016',
            title: 'Bulk ticket 2',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            customerId: customer1Id,
            assignedToId: agent2Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'ESC-017',
            title: 'Bulk ticket 3',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
        ],
      });

      const result = await ticketEscalationService.escalateOverdueTickets();

      expect(result.ticketsChecked).toBe(3);
      expect(result.ticketsEscalated).toBe(3);

      const escalatedCount = await prisma.ticket.count({
        where: {
          protocol: { in: ['ESC-015', 'ESC-016', 'ESC-017'] },
          status: TicketStatus.ESCALATED,
        },
      });

      expect(escalatedCount).toBe(3);
    });
  });
});
