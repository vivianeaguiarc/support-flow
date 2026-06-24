import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../app.js';
import { AuditAction } from '../../modules/audit/domain/audit-actions.js';
import { prisma } from '../../shared/database/prisma.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from './database.js';
import { seedIntegrationFixtures } from './fixtures.js';
import { authRequest, login, unwrapApiData } from './http-client.js';

describe.sequential('Immutable audit logs integration', () => {
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

  async function createTicket(
    token: string,
    tenantId: string,
  ): Promise<string> {
    const customer = await prisma.customer.findFirst({ where: { tenantId } });

    const response = await authRequest(app, token)
      .post('/api/v1/tickets')
      .send({
        title: 'Audit ticket',
        description: 'Ticket used by audit integration tests',
        customerId: customer!.id,
      })
      .expect(201);

    return response.body.data.id;
  }

  it('appends a chained audit record when a ticket is created', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const ticketId = await createTicket(token, fixtures.tenantA.id);

    const log = await prisma.auditLog.findFirst({
      where: { entityId: ticketId, action: AuditAction.TICKET_CREATED },
    });

    expect(log).toBeTruthy();
    expect(log?.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(log?.organizationId).toBe(fixtures.tenantA.id);
  });

  it('lists audit logs for an admin', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await createTicket(token, fixtures.tenantA.id);

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .expect(200);

    const data = unwrapApiData(response.body) as {
      data: unknown[];
      total: number;
    };

    expect(data.total).toBeGreaterThan(0);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('verifies the integrity of a valid chain', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await createTicket(token, fixtures.tenantA.id);

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs/verify')
      .expect(200);

    const data = unwrapApiData(response.body) as {
      status: string;
      valid: boolean;
      totalVerified: number;
      firstInvalid: unknown;
    };

    expect(data.valid).toBe(true);
    expect(data.status).toBe('VALID');
    expect(data.totalVerified).toBeGreaterThan(0);
    expect(data.firstInvalid).toBeNull();
  });

  it('detects a tampered record during verification', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await createTicket(token, fixtures.tenantA.id);

    const first = await prisma.auditLog.findFirst({
      orderBy: { sequence: 'asc' },
    });

    // Tamper with the stored content directly via raw SQL, bypassing the
    // application layer (which never exposes UPDATE). Triggers are disabled
    // temporarily because, in environments provisioned via `migrate deploy`,
    // the append-only trigger would (correctly) reject this UPDATE.
    await prisma.$executeRawUnsafe(
      'ALTER TABLE audit_logs DISABLE TRIGGER USER',
    );
    await prisma.$executeRawUnsafe(
      'UPDATE audit_logs SET action = $1 WHERE id = $2',
      'tampered.action',
      first!.id,
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE audit_logs ENABLE TRIGGER USER',
    );

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs/verify')
      .expect(200);

    const data = unwrapApiData(response.body) as {
      status: string;
      valid: boolean;
      firstInvalid: { id: string } | null;
    };

    expect(data.valid).toBe(false);
    expect(data.status).toBe('BROKEN');
    expect(data.firstInvalid?.id).toBe(first!.id);
  });

  it('blocks access for users without the audit.read permission', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.agentA.email, fixtures.password);

    await authRequest(app, token).get('/api/v1/admin/audit-logs').expect(403);
    await authRequest(app, token)
      .get('/api/v1/admin/audit-logs/verify')
      .expect(403);
  });
});
