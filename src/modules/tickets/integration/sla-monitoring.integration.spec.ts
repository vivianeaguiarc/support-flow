import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../../shared/database/prisma.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { NotificationType } from '../../notifications/domain/notification-types.js';
import { TicketStatus } from '../domain/ticket-enums.js';
import { slaMonitoringService } from '../services/sla-monitoring.service.js';

describe.sequential('SLA Monitoring', () => {
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
      data: { name: 'Tenant SLA', slug: 'tenant-sla' },
    });
    tenantId = tenant.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-sla@test.com',
        name: 'Agent 1 SLA',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent1Id = agent1.id;

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-sla@test.com',
        name: 'Agent 2 SLA',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent2Id = agent2.id;

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-sla@test.com',
        name: 'Customer 1 SLA',
        tenantId,
      },
    });
    customer1Id = customer1.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('SLA Warning Detection', () => {
    it('should create SLA_WARNING notification for ticket expiring in 12 hours', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-001',
          title: 'Ticket expiring soon',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.ticketsChecked).toBe(1);
      expect(result.warningsCreated).toBe(1);
      expect(result.expiredNotificationsCreated).toBe(0);

      const notifications = await prisma.notification.findMany({
        where: {
          type: NotificationType.SLA_WARNING,
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].recipientId).toBe(agent1Id);
      expect(notifications[0].title).toBe('SLA próximo do vencimento');
      expect(notifications[0].message).toContain('vencerá em');
    });

    it('should create SLA_WARNING for ticket expiring in 23 hours', async () => {
      const slaDueAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-002',
          title: 'Ticket expiring in 23h',
          description: 'Test',
          status: TicketStatus.IN_PROGRESS,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.warningsCreated).toBe(1);
    });

    it('should NOT create warning for ticket expiring in 25 hours', async () => {
      const slaDueAt = new Date(Date.now() + 25 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-003',
          title: 'Ticket expiring later',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.warningsCreated).toBe(0);
    });

    it('should NOT create warning for ticket without assignee', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-004',
          title: 'Unassigned ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.warningsCreated).toBe(0);
    });
  });

  describe('SLA Expired Detection', () => {
    it('should create SLA_EXPIRED notification for overdue ticket', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-005',
          title: 'Overdue ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.ticketsChecked).toBe(1);
      expect(result.warningsCreated).toBe(0);
      expect(result.expiredNotificationsCreated).toBe(1);

      const notifications = await prisma.notification.findMany({
        where: {
          type: NotificationType.SLA_EXPIRED,
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].recipientId).toBe(agent1Id);
      expect(notifications[0].title).toBe('SLA vencido');
      expect(notifications[0].message).toContain('venceu há');
    });

    it('should NOT create expired notification for ticket without assignee', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-006',
          title: 'Overdue unassigned',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          slaDueAt,
        },
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.expiredNotificationsCreated).toBe(0);
    });
  });

  describe('Status Filtering', () => {
    it('should check tickets with eligible statuses', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'SLA-007',
            title: 'Open ticket',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'SLA-008',
            title: 'In progress ticket',
            description: 'Test',
            status: TicketStatus.IN_PROGRESS,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'SLA-009',
            title: 'Waiting customer',
            description: 'Test',
            status: TicketStatus.WAITING_CUSTOMER,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'SLA-010',
            title: 'Escalated ticket',
            description: 'Test',
            status: TicketStatus.ESCALATED,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
        ],
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.ticketsChecked).toBe(4);
      expect(result.warningsCreated).toBe(4);
    });

    it('should NOT check resolved or closed tickets', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'SLA-011',
            title: 'Resolved ticket',
            description: 'Test',
            status: TicketStatus.RESOLVED,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
          {
            tenantId,
            protocol: 'SLA-012',
            title: 'Closed ticket',
            description: 'Test',
            status: TicketStatus.CLOSED,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt,
          },
        ],
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.ticketsChecked).toBe(0);
      expect(result.warningsCreated).toBe(0);
    });
  });

  describe('Duplicate Prevention', () => {
    it('should NOT create duplicate SLA_WARNING notifications', async () => {
      const slaDueAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-013',
          title: 'Duplicate warning test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      // First run
      const result1 = await slaMonitoringService.checkSlaStatus();
      expect(result1.warningsCreated).toBe(1);

      // Second run - should not create duplicate
      const result2 = await slaMonitoringService.checkSlaStatus();
      expect(result2.warningsCreated).toBe(0);

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
          type: NotificationType.SLA_WARNING,
        },
      });

      expect(notifications).toHaveLength(1);
    });

    it('should NOT create duplicate SLA_EXPIRED notifications', async () => {
      const slaDueAt = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-014',
          title: 'Duplicate expired test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt,
        },
      });

      // First run
      const result1 = await slaMonitoringService.checkSlaStatus();
      expect(result1.expiredNotificationsCreated).toBe(1);

      // Second run - should not create duplicate
      const result2 = await slaMonitoringService.checkSlaStatus();
      expect(result2.expiredNotificationsCreated).toBe(0);

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticket.id,
          type: NotificationType.SLA_EXPIRED,
        },
      });

      expect(notifications).toHaveLength(1);
    });

    it('can create both WARNING and EXPIRED for same ticket over time', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'SLA-015',
          title: 'Progression test',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
          assignedToId: agent1Id,
          slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      // First run - creates warning
      const result1 = await slaMonitoringService.checkSlaStatus();
      expect(result1.warningsCreated).toBe(1);

      // Update ticket to be expired
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      });

      // Second run - creates expired (different type)
      const result2 = await slaMonitoringService.checkSlaStatus();
      expect(result2.expiredNotificationsCreated).toBe(1);

      const notifications = await prisma.notification.findMany({
        where: { ticketId: ticket.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(notifications).toHaveLength(2);
      expect(notifications[0].type).toBe(NotificationType.SLA_WARNING);
      expect(notifications[1].type).toBe(NotificationType.SLA_EXPIRED);
    });
  });

  describe('Multiple Tickets Processing', () => {
    it('should process multiple tickets with different SLA states', async () => {
      await prisma.ticket.createMany({
        data: [
          {
            tenantId,
            protocol: 'SLA-016',
            title: 'Expiring soon',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          },
          {
            tenantId,
            protocol: 'SLA-017',
            title: 'Already expired',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent2Id,
            slaDueAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
          {
            tenantId,
            protocol: 'SLA-018',
            title: 'Still safe',
            description: 'Test',
            status: TicketStatus.OPEN,
            customerId: customer1Id,
            assignedToId: agent1Id,
            slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
        ],
      });

      const result = await slaMonitoringService.checkSlaStatus();

      expect(result.ticketsChecked).toBe(3);
      expect(result.warningsCreated).toBe(1);
      expect(result.expiredNotificationsCreated).toBe(1);
    });
  });
});
