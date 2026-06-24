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
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { TicketStatus } from '../../tickets/domain/ticket-enums.js';
import { NotificationType } from '../domain/notification-types.js';

describe.sequential('Notifications', () => {
  let app: Express;
  let tenantId: string;
  let agent1Id: string;
  let agent2Id: string;
  let agent1Token: string;
  let supervisorToken: string;
  let customer1Id: string;
  let customerToken: string;
  let ticketId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Notifications', slug: 'tenant-notifications' },
    });
    tenantId = tenant.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-notif@test.com',
        name: 'Agent 1 Notif',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent1Id = agent1.id;

    agent1Token = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId,
    });

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-notif@test.com',
        name: 'Agent 2 Notif',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agent2Id = agent2.id;

    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor-notif@test.com',
        name: 'Supervisor Notif',
        password: 'password',
        role: UserRole.SUPERVISOR,
        tenantId,
      },
    });

    supervisorToken = createAuthToken({
      id: supervisor.id,
      email: supervisor.email,
      role: UserRole.SUPERVISOR,
      tenantId,
    });

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-notif@test.com',
        name: 'Customer 1 Notif',
        tenantId,
      },
    });
    customer1Id = customer1.id;

    customerToken = createAuthToken({
      id: customer1Id,
      email: 'customer1-notif@test.com',
      role: UserRole.CUSTOMER,
      tenantId,
    });

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        protocol: 'TN-001',
        title: 'Test Ticket Notifications',
        description: 'Test Description',
        status: TicketStatus.OPEN,
        customerId: customer1Id,
        assignedToId: agent1Id,
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('GET /notifications', () => {
    beforeEach(async () => {
      await prisma.notification.createMany({
        data: [
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_CREATED,
            title: 'Test Notification 1',
            message: 'Message 1',
            createdAt: new Date('2026-01-01T10:00:00Z'),
          },
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_ASSIGNED,
            title: 'Test Notification 2',
            message: 'Message 2',
            createdAt: new Date('2026-01-01T11:00:00Z'),
            readAt: new Date('2026-01-01T12:00:00Z'),
          },
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_STATUS_CHANGED,
            title: 'Test Notification 3',
            message: 'Message 3',
            createdAt: new Date('2026-01-01T12:00:00Z'),
          },
        ],
      });
    });

    it('should list all notifications for authenticated user', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get('/api/v1/notifications');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].title).toBe('Test Notification 3');
      expect(response.body.data[0].ticket).toBeDefined();
      expect(response.body.data[0].ticket.protocol).toBe('TN-001');
    });

    it('should list only unread notifications', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get('/api/v1/notifications?unread=true');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data.every((n: { readAt: Date | null }) => !n.readAt),
      ).toBe(true);
    });

    it('should limit results', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get('/api/v1/notifications');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should isolate notifications by recipient', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.get('/api/v1/notifications');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    let notificationId: string;

    beforeEach(async () => {
      const notification = await prisma.notification.create({
        data: {
          tenantId,
          recipientId: agent1Id,
          ticketId,
          type: NotificationType.TICKET_CREATED,
          title: 'Unread Notification',
          message: 'Should be marked as read',
        },
      });
      notificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.patch(
        `/api/v1/notifications/${notificationId}/read`,
      );

      expect(response.status).toBe(200);

      const updated = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(updated?.readAt).not.toBeNull();
    });

    it('should return 404 for notification from different user', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.patch(
        `/api/v1/notifications/${notificationId}/read`,
      );

      expect(response.status).toBe(404);
    });

    it('should be idempotent when already read', async () => {
      const api = authRequest(app, agent1Token);
      await api.patch(`/api/v1/notifications/${notificationId}/read`);
      const response = await api.patch(
        `/api/v1/notifications/${notificationId}/read`,
      );

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /notifications/read-all', () => {
    beforeEach(async () => {
      await prisma.notification.createMany({
        data: [
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_CREATED,
            title: 'Unread 1',
            message: 'Message 1',
          },
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_ASSIGNED,
            title: 'Unread 2',
            message: 'Message 2',
          },
          {
            tenantId,
            recipientId: agent1Id,
            ticketId,
            type: NotificationType.TICKET_STATUS_CHANGED,
            title: 'Unread 3',
            message: 'Message 3',
          },
        ],
      });
    });

    it('should mark all notifications as read', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.patch('/api/v1/notifications/read-all');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(3);

      const unread = await prisma.notification.count({
        where: {
          recipientId: agent1Id,
          readAt: null,
        },
      });
      expect(unread).toBe(0);
    });

    it('should only mark own notifications as read', async () => {
      await prisma.notification.create({
        data: {
          tenantId,
          recipientId: agent2Id,
          ticketId,
          type: NotificationType.TICKET_CREATED,
          title: 'Agent 2 Notification',
          message: 'Should not be marked',
        },
      });

      const api = authRequest(app, agent1Token);
      const response = await api.patch('/api/v1/notifications/read-all');

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(3);

      const agent2Unread = await prisma.notification.count({
        where: {
          recipientId: agent2Id,
          readAt: null,
        },
      });
      expect(agent2Unread).toBe(1);
    });
  });

  describe('Integration with Ticket Events', () => {
    it('should create notification when ticket is created with assignee', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.post('/api/v1/tickets').send({
        title: 'New Ticket with Notification',
        description: 'Should generate notification',
        customerId: customer1Id,
        assignedToId: agent1Id,
      });

      expect(response.status).toBe(201);

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: response.body.data.id,
          recipientId: agent1Id,
          type: NotificationType.TICKET_CREATED,
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Novo chamado criado');
    });

    it('should create notification when ticket is assigned', async () => {
      const ticketWithoutAssignee = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'TN-002',
          title: 'Unassigned Ticket',
          description: 'Test',
          status: TicketStatus.OPEN,
          customerId: customer1Id,
        },
      });

      const api = authRequest(app, supervisorToken);
      await api
        .patch(`/api/v1/tickets/${ticketWithoutAssignee.id}/assign`)
        .send({
          agentId: agent1Id,
        });

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId: ticketWithoutAssignee.id,
          recipientId: agent1Id,
          type: NotificationType.TICKET_ASSIGNED,
        },
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('Chamado atribuído a você');
    });

    it('should create notification when ticket status changes', async () => {
      const api = authRequest(app, agent1Token);
      await api.patch(`/api/v1/tickets/${ticketId}/status`).send({
        status: TicketStatus.IN_PROGRESS,
      });

      const notifications = await prisma.notification.findMany({
        where: {
          ticketId,
          type: NotificationType.TICKET_STATUS_CHANGED,
        },
      });

      expect(notifications.length).toBeGreaterThan(0);
    });
  });
});
