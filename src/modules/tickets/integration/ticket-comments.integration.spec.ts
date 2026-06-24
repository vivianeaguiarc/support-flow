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
import { TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket Comments', () => {
  let app: Express;
  let tenant1Id: string;
  let tenant2Id: string;
  let agent1Id: string;
  let agent2Id: string;
  let agent1Token: string;
  let agent2Token: string;
  let adminToken: string;
  let customerToken: string;
  let customer1Id: string;
  let ticket1Id: string;
  let ticket2Id: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1 Comments',
        slug: 'tenant-1-comments',
      },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Tenant 2 Comments',
        slug: 'tenant-2-comments',
      },
    });
    tenant2Id = tenant2.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-comments@test.com',
        name: 'Agent 1 Comments',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });
    agent1Id = agent1.id;

    agent1Token = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId: tenant1Id,
    });

    const agent2 = await prisma.user.create({
      data: {
        email: 'agent2-comments@test.com',
        name: 'Agent 2 Comments',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant2Id,
      },
    });
    agent2Id = agent2.id;

    agent2Token = createAuthToken({
      id: agent2.id,
      email: agent2.email,
      role: UserRole.AGENT,
      tenantId: tenant2Id,
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin-comments@test.com',
        name: 'Admin Comments',
        password: 'password',
        role: UserRole.ADMIN,
        tenantId: tenant1Id,
      },
    });

    adminToken = createAuthToken({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      tenantId: tenant1Id,
    });

    const customer1 = await prisma.customer.create({
      data: {
        email: 'customer1-comments@test.com',
        name: 'Customer 1 Comments',
        tenantId: tenant1Id,
      },
    });
    customer1Id = customer1.id;

    customerToken = createAuthToken({
      id: customer1Id,
      email: 'customer1-comments@test.com',
      role: UserRole.CUSTOMER,
      tenantId: tenant1Id,
    });

    const ticket1 = await prisma.ticket.create({
      data: {
        tenantId: tenant1Id,
        protocol: 'TC-001',
        title: 'Test Ticket 1',
        description: 'Test Description 1',
        status: TicketStatus.OPEN,
        customerId: customer1Id,
      },
    });
    ticket1Id = ticket1.id;

    const customer2 = await prisma.customer.create({
      data: {
        email: 'customer2-comments@test.com',
        name: 'Customer 2 Comments',
        tenantId: tenant2Id,
      },
    });

    const ticket2 = await prisma.ticket.create({
      data: {
        tenantId: tenant2Id,
        protocol: 'TC-002',
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        status: TicketStatus.OPEN,
        customerId: customer2.id,
      },
    });
    ticket2Id = ticket2.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('POST /tickets/:id/comments', () => {
    it('should create a comment as an agent', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: 'This is an internal comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        ticketId: ticket1Id,
        tenantId: tenant1Id,
        authorId: agent1Id,
        content: 'This is an internal comment',
        visibility: 'INTERNAL',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should create a comment as an admin', async () => {
      const api = authRequest(app, adminToken);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: 'Admin internal comment',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Admin internal comment');
    });

    it('should record COMMENT_ADDED event in ticket history', async () => {
      const api = authRequest(app, agent1Token);
      await api.post(`/api/v1/tickets/${ticket1Id}/comments`).send({
        content: 'Comment to test history',
      });

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket1Id,
          event: 'COMMENT_ADDED',
        },
      });

      expect(history).toHaveLength(1);
      expect(history[0].field).toBe('comment');
    });

    it('should deny customer access to create comments', async () => {
      const api = authRequest(app, customerToken);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: 'Customer trying to comment',
        });

      expect(response.status).toBe(403);
    });

    it('should deny agent from different tenant', async () => {
      const api = authRequest(app, agent2Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: 'Comment from wrong tenant',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent ticket', async () => {
      const api = authRequest(app, agent1Token);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api
        .post(`/api/v1/tickets/${fakeId}/comments`)
        .send({
          content: 'Comment on non-existent ticket',
        });

      expect(response.status).toBe(404);
    });

    it('should return validation error for empty content', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: '',
        });

      expect(response.status).toBe(400);
    });

    it('should return validation error for content over 5000 characters', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: 'a'.repeat(5001),
        });

      expect(response.status).toBe(400);
    });

    it('should trim whitespace from content', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/comments`)
        .send({
          content: '  Comment with spaces  ',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Comment with spaces');
    });
  });

  describe('GET /tickets/:id/comments', () => {
    beforeEach(async () => {
      await prisma.ticketComment.createMany({
        data: [
          {
            tenantId: tenant1Id,
            ticketId: ticket1Id,
            authorId: agent1Id,
            content: 'First comment',
            createdAt: new Date('2026-01-01T10:00:00Z'),
          },
          {
            tenantId: tenant1Id,
            ticketId: ticket1Id,
            authorId: agent1Id,
            content: 'Second comment',
            createdAt: new Date('2026-01-01T11:00:00Z'),
          },
          {
            tenantId: tenant1Id,
            ticketId: ticket1Id,
            authorId: agent1Id,
            content: 'Third comment',
            createdAt: new Date('2026-01-01T12:00:00Z'),
          },
        ],
      });
    });

    it('should list comments ordered by creation date (oldest first)', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].content).toBe('First comment');
      expect(response.body.data[1].content).toBe('Second comment');
      expect(response.body.data[2].content).toBe('Third comment');
    });

    it('should include author information', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].author).toMatchObject({
        id: agent1Id,
        name: 'Agent 1 Comments',
        email: 'agent1-comments@test.com',
      });
    });

    it('should return empty array for ticket without comments', async () => {
      await prisma.ticketComment.deleteMany({ where: { ticketId: ticket1Id } });

      const api = authRequest(app, agent1Token);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should allow admin to list comments', async () => {
      const api = authRequest(app, adminToken);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('should deny customer access to list comments', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(403);
    });

    it('should deny agent from different tenant', async () => {
      const api = authRequest(app, agent2Token);
      const response = await api.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent ticket', async () => {
      const api = authRequest(app, agent1Token);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api.get(`/api/v1/tickets/${fakeId}/comments`);

      expect(response.status).toBe(404);
    });

    it('should isolate comments by tenant', async () => {
      await prisma.ticketComment.create({
        data: {
          tenantId: tenant2Id,
          ticketId: ticket2Id,
          authorId: agent2Id,
          content: 'Comment in tenant 2',
        },
      });

      const api1 = authRequest(app, agent1Token);
      const response1 = await api1.get(`/api/v1/tickets/${ticket1Id}/comments`);

      expect(response1.status).toBe(200);
      expect(response1.body.data).toHaveLength(3);
      expect(
        response1.body.data.every(
          (c: { content: string }) => c.content !== 'Comment in tenant 2',
        ),
      ).toBe(true);
    });
  });

  describe('POST /tickets/:ticketId/internal-comments', () => {
    it('should create an internal comment using the canonical route', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/internal-comments`)
        .send({
          content: 'Canonical internal comment route',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject({
        ticketId: ticket1Id,
        authorId: agent1Id,
        content: 'Canonical internal comment route',
        visibility: 'INTERNAL',
      });
    });

    it('should deny customer access on internal-comments route', async () => {
      const api = authRequest(app, customerToken);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/internal-comments`)
        .send({ content: 'Customer blocked' });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent ticket on internal-comments route', async () => {
      const api = authRequest(app, agent1Token);
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await api
        .post(`/api/v1/tickets/${fakeId}/internal-comments`)
        .send({ content: 'Missing ticket' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for empty content on internal-comments route', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/internal-comments`)
        .send({ content: '   ' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /tickets/:ticketId/internal-comments', () => {
    beforeEach(async () => {
      await prisma.ticketComment.deleteMany({ where: { ticketId: ticket1Id } });
      await prisma.ticketComment.create({
        data: {
          tenantId: tenant1Id,
          ticketId: ticket1Id,
          authorId: agent1Id,
          content: 'Internal via canonical route',
        },
      });
    });

    it('should list internal comments using the canonical route', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/internal-comments`,
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].content).toBe(
        'Internal via canonical route',
      );
      expect(response.body.data[0].author.id).toBe(agent1Id);
    });

    it('should deny customer access to list internal comments', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/internal-comments`,
      );

      expect(response.status).toBe(403);
    });
  });
});
