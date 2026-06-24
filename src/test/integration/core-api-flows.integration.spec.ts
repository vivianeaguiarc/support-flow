import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { TicketStatus } from '../../modules/tickets/domain/ticket-enums.js';
import { UserRole } from '../../shared/types/user-role.js';
import {
  CORE_FLOW_PASSWORD,
  seedCoreFlowFixtures,
} from './core-flow-fixtures.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from './database.js';
import {
  authRequest,
  createAuthToken,
  getApiErrorMessage,
  login,
  unwrapApiData,
} from './http-client.js';

describe.sequential('Core API flows (E2E)', () => {
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

  describe('Authentication', () => {
    it('should register a customer publicly and login with issued credentials', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const email = `new-customer-${Date.now()}@supportflow.test`;

      const registerResponse = await request(app)
        .post('/api/v1/users')
        .send({
          name: 'New Customer',
          email,
          password: CORE_FLOW_PASSWORD,
          role: UserRole.CUSTOMER,
        })
        .expect(201);

      expect(registerResponse.body.data).toMatchObject({
        email,
        role: UserRole.CUSTOMER,
        tenantId: fixtures.tenant.id,
      });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: CORE_FLOW_PASSWORD })
        .expect(200);

      const loginTokens = unwrapApiData(loginResponse.body);
      expect(loginTokens.accessToken).toEqual(expect.any(String));
      expect(loginTokens.refreshToken).toEqual(expect.any(String));

      const api = authRequest(app, loginTokens.accessToken);
      await api.get('/api/v1/tickets').expect(200);
    });

    it('should login fixture users and validate JWT on protected routes', async () => {
      const fixtures = await seedCoreFlowFixtures();

      const adminToken = await login(
        app,
        fixtures.admin.email,
        fixtures.password,
      );
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const customerToken = await login(
        app,
        fixtures.customerUser.email,
        fixtures.password,
      );

      await authRequest(app, adminToken).get('/api/v1/users').expect(200);
      await authRequest(app, agentToken).get('/api/v1/tickets').expect(200);
      await authRequest(app, customerToken).get('/api/v1/tickets').expect(200);
    });

    it('should reject access without token or with invalid JWT', async () => {
      await request(app).get('/api/v1/tickets').expect(401);

      await authRequest(app, 'invalid.jwt.token')
        .get('/api/v1/tickets')
        .expect(401);
    });
  });

  describe('Tickets lifecycle', () => {
    it('should create, list, find, assign, update status and close a ticket', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const api = authRequest(app, agentToken);

      const createResponse = await api
        .post('/api/v1/tickets')
        .send({
          title: 'Core flow ticket',
          description: 'Ticket created during core API E2E coverage',
          customerId: fixtures.customer.id,
          priority: 'HIGH',
          categoryId: fixtures.category.id,
        })
        .expect(201);

      const ticketId = createResponse.body.data.id as string;

      expect(createResponse.body.data).toMatchObject({
        status: TicketStatus.OPEN,
        customerId: fixtures.customer.id,
        tenantId: fixtures.tenant.id,
      });
      expect(createResponse.body.data.protocol).toMatch(
        /^SF-\d{8}-[A-Z0-9]{6}$/,
      );

      const listResponse = await api.get('/api/v1/tickets').expect(200);

      expect(listResponse.body.data.total).toBe(1);
      expect(listResponse.body.data.data[0].id).toBe(ticketId);

      const findResponse = await api
        .get(`/api/v1/tickets/${ticketId}`)
        .expect(200);

      expect(findResponse.body.data.id).toBe(ticketId);

      await api
        .patch(`/api/v1/tickets/${ticketId}/assign`)
        .send({ assignedToId: fixtures.agent.id })
        .expect(200);

      await api
        .patch(`/api/v1/tickets/${ticketId}/status`)
        .send({ status: TicketStatus.IN_PROGRESS })
        .expect(200);

      const resolvedResponse = await api
        .patch(`/api/v1/tickets/${ticketId}/status`)
        .send({ status: TicketStatus.RESOLVED })
        .expect(200);

      expect(resolvedResponse.body.data.status).toBe(TicketStatus.RESOLVED);

      const closedResponse = await api
        .patch(`/api/v1/tickets/${ticketId}/status`)
        .send({ status: TicketStatus.CLOSED })
        .expect(200);

      expect(closedResponse.body.data.status).toBe(TicketStatus.CLOSED);
      expect(closedResponse.body.data.closedAt).toBeTruthy();
    });
  });

  describe('Permissions (RBAC)', () => {
    it('should allow admin on administrative routes and deny agent', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const adminToken = await login(
        app,
        fixtures.admin.email,
        fixtures.password,
      );
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );

      await authRequest(app, adminToken).get('/api/v1/users').expect(200);
      await authRequest(app, agentToken).get('/api/v1/users').expect(403);
    });

    it('should allow agent to manage tickets and block customer from staff actions', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const customerToken = await login(
        app,
        fixtures.customerUser.email,
        fixtures.password,
      );

      const createResponse = await authRequest(app, agentToken)
        .post('/api/v1/tickets')
        .send({
          title: 'RBAC ticket',
          description: 'Ticket for permission checks in core E2E',
          customerId: fixtures.customer.id,
          priority: 'MEDIUM',
        })
        .expect(201);

      const ticketId = createResponse.body.data.id as string;

      await authRequest(app, agentToken)
        .patch(`/api/v1/tickets/${ticketId}/assign`)
        .send({ assignedToId: fixtures.agent.id })
        .expect(200);

      await authRequest(app, customerToken)
        .patch(`/api/v1/tickets/${ticketId}/assign`)
        .send({ assignedToId: fixtures.agent.id })
        .expect(403);

      await authRequest(app, customerToken)
        .patch(`/api/v1/tickets/${ticketId}/status`)
        .send({ status: TicketStatus.IN_PROGRESS })
        .expect(403);
    });

    it('should prevent customer from accessing another customer ticket', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const customerToken = await login(
        app,
        fixtures.customerUser.email,
        fixtures.password,
      );

      const otherTicketResponse = await authRequest(app, agentToken)
        .post('/api/v1/tickets')
        .send({
          title: 'Other customer ticket',
          description: 'Ticket owned by a different customer entity',
          customerId: fixtures.otherCustomer.id,
          priority: 'LOW',
        })
        .expect(201);

      const otherTicketId = otherTicketResponse.body.data.id as string;

      await authRequest(app, customerToken)
        .get(`/api/v1/tickets/${otherTicketId}`)
        .expect(403);

      await authRequest(app, customerToken)
        .get('/api/v1/tickets')
        .query({ customerId: fixtures.otherCustomer.id })
        .expect(403);
    });

    it('should return 403 for cross-tenant access', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );

      const createResponse = await authRequest(app, agentToken)
        .post('/api/v1/tickets')
        .send({
          title: 'Tenant scoped ticket',
          description: 'Ticket isolated by tenant in core E2E',
          customerId: fixtures.customer.id,
          priority: 'MEDIUM',
        })
        .expect(201);

      const foreignToken = createAuthToken({
        id: fixtures.agent.id,
        email: fixtures.agent.email,
        role: UserRole.AGENT,
        tenantId: '00000000-0000-0000-0000-000000000099',
      });

      await authRequest(app, foreignToken)
        .get(`/api/v1/tickets/${createResponse.body.data.id as string}`)
        .expect(403);
    });
  });

  describe('Validation and error handling', () => {
    it('should return 400 for invalid payloads', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const api = authRequest(app, agentToken);

      const invalidCreate = await api
        .post('/api/v1/tickets')
        .send({
          title: 'x',
          description: 'short',
          customerId: fixtures.customer.id,
        })
        .expect(400);

      expect(invalidCreate.status).toBe(400);

      const invalidLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: '123' })
        .expect(400);

      expect(invalidLogin.status).toBe(400);
    });

    it('should return 404 for missing resources', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const adminToken = await login(
        app,
        fixtures.admin.email,
        fixtures.password,
      );
      const missingId = '00000000-0000-4000-8000-000000000099';

      await authRequest(app, adminToken)
        .get(`/api/v1/tickets/${missingId}`)
        .expect(404);

      await authRequest(app, adminToken)
        .get(`/api/v1/users/${missingId}`)
        .expect(404);
    });

    it('should return controlled 400 for invalid business operations', async () => {
      const fixtures = await seedCoreFlowFixtures();
      const agentToken = await login(
        app,
        fixtures.agent.email,
        fixtures.password,
      );
      const api = authRequest(app, agentToken);

      const createResponse = await api
        .post('/api/v1/tickets')
        .send({
          title: 'Invalid transition ticket',
          description: 'Ticket used to validate business rule errors',
          customerId: fixtures.customer.id,
          priority: 'MEDIUM',
        })
        .expect(201);

      const ticketId = createResponse.body.data.id as string;

      const blockedTransition = await api
        .patch(`/api/v1/tickets/${ticketId}/status`)
        .send({ status: TicketStatus.IN_PROGRESS })
        .expect(400);

      expect(getApiErrorMessage(blockedTransition.body)).toBe(
        'Ticket must be assigned before moving to IN_PROGRESS.',
      );
    });
  });
});
