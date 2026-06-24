import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { OutboxEventStatus } from '../../modules/outbox/domain/outbox-event-status.js';
import { prisma } from '../../shared/database/prisma.js';
import { DomainEventName } from '../../shared/events/domain-event-names.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from './database.js';
import { seedIntegrationFixtures } from './fixtures.js';
import { authRequest, login } from './http-client.js';

describe.sequential('Transactional outbox integration', () => {
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

  it('should persist ticket.created in outbox in the same flow as ticket creation', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const customer = await prisma.customer.findFirst({
      where: { tenantId: fixtures.tenantA.id },
    });

    const response = await authRequest(app, token)
      .post('/api/v1/tickets')
      .send({
        title: 'Outbox ticket',
        description: 'Created with transactional outbox',
        customerId: customer!.id,
      })
      .expect(201);

    const ticketId = response.body.data.id;

    const outboxEvent = await prisma.outboxEvent.findFirst({
      where: {
        aggregateId: ticketId,
        eventName: DomainEventName.TICKET_CREATED,
      },
    });

    expect(outboxEvent).toBeTruthy();
    expect(outboxEvent?.status).toBe(OutboxEventStatus.PROCESSED);
  });

  it('should expose admin outbox listing and metrics', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const customer = await prisma.customer.findFirst({
      where: { tenantId: fixtures.tenantA.id },
    });

    await authRequest(app, token)
      .post('/api/v1/tickets')
      .send({
        title: 'Metrics ticket',
        description: 'Outbox metrics test',
        customerId: customer!.id,
      })
      .expect(201);

    const listResponse = await authRequest(app, token)
      .get('/api/v1/admin/outbox')
      .expect(200);

    expect(listResponse.body.data.data.length).toBeGreaterThan(0);

    const metricsResponse = await authRequest(app, token)
      .get('/api/v1/admin/outbox/metrics')
      .expect(200);

    expect(metricsResponse.body.data).toMatchObject({
      processed: expect.any(Number),
      pending: expect.any(Number),
      failed: expect.any(Number),
      total: expect.any(Number),
    });
  });
});
