import { createServer, type Server } from 'node:http';

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
  login,
} from '../../../test/integration/http-client.js';
import { WebhookEvent } from '../domain/webhook-event.js';

describe.sequential('Webhooks integration', () => {
  let app: Express;
  let receiverServer: Server;
  let receiverUrl = '';
  let lastRequest: {
    headers: Record<string, string | string[] | undefined>;
    body: string;
  } | null = null;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();

    receiverServer = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        lastRequest = {
          headers: req.headers as Record<string, string | string[] | undefined>,
          body,
        };
        res.writeHead(200);
        res.end('received');
      });
    });

    await new Promise<void>((resolve) => {
      receiverServer.listen(0, '127.0.0.1', () => {
        const address = receiverServer.address();
        if (address && typeof address === 'object') {
          receiverUrl = `http://127.0.0.1:${address.port}/webhook`;
        }
        resolve();
      });
    });
  });

  beforeEach(async () => {
    await resetTestDatabase();
    lastRequest = null;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      receiverServer.close(() => resolve());
    });
    await disconnectTestDatabase();
  });

  it('should allow admin to manage webhooks and send test delivery', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const createResponse = await adminApi
      .post('/api/v1/webhooks')
      .send({
        name: 'Integration Hook',
        url: receiverUrl,
        events: [WebhookEvent.TICKET_CREATED, WebhookEvent.TICKET_RESOLVED],
      })
      .expect(201);

    const webhookId = createResponse.body.data.id as string;
    const secret = createResponse.body.data.secret as string;

    expect(secret.startsWith('whsec_')).toBe(true);
    expect(createResponse.body.data.secret).toBeTruthy();

    const listResponse = await adminApi.get('/api/v1/webhooks').expect(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].secret).toBeUndefined();

    const getResponse = await adminApi
      .get(`/api/v1/webhooks/${webhookId}`)
      .expect(200);
    expect(getResponse.body.data.id).toBe(webhookId);
    expect(getResponse.body.data.secret).toBeUndefined();

    const testResponse = await adminApi
      .post(`/api/v1/webhooks/${webhookId}/test`)
      .expect(200);

    expect(testResponse.body.data.status).toBe('DELIVERED');
    expect(testResponse.body.data.attemptCount).toBe(1);
    expect(lastRequest).not.toBeNull();
    expect(lastRequest?.headers['x-supportflow-event']).toBe(
      WebhookEvent.TICKET_CREATED,
    );
    expect(lastRequest?.headers['x-supportflow-delivery-id']).toBeTruthy();
    expect(String(lastRequest?.headers['x-supportflow-signature'])).toMatch(
      /^sha256=/,
    );

    const deliveriesBeforeDelete = await prisma.webhookDelivery.findMany({
      where: { tenantId: fixtures.tenantA.id },
    });
    expect(deliveriesBeforeDelete.length).toBeGreaterThan(0);

    await adminApi
      .patch(`/api/v1/webhooks/${webhookId}`)
      .send({ active: false, name: 'Updated Hook' })
      .expect(200);

    await adminApi.del(`/api/v1/webhooks/${webhookId}`).expect(200);

    const emptyList = await adminApi.get('/api/v1/webhooks').expect(200);
    expect(emptyList.body.data).toHaveLength(0);
  });

  it('should forbid non-admin from managing webhooks', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken)
      .post('/api/v1/webhooks')
      .send({
        name: 'Forbidden',
        url: receiverUrl,
        events: [WebhookEvent.TICKET_CREATED],
      })
      .expect(403);

    await authRequest(app, agentToken).get('/api/v1/webhooks').expect(403);
  });
});
