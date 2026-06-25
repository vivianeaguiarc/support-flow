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

  async function insertAuditLog(input: {
    action: string;
    entity: string;
    entityId?: string | null;
    userId?: string | null;
    organizationId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: Date;
    hash?: string;
    previousHash?: string | null;
  }): Promise<string> {
    const created = await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        metadata: (input.metadata ?? undefined) as never,
        previousHash: input.previousHash ?? null,
        hash: input.hash ?? `hash-${Math.random().toString(16).slice(2)}`,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
      },
    });

    return created.id;
  }

  it('lists audit logs for an admin in a paginated envelope', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await createTicket(token, fixtures.tenantA.id);

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 10,
      hasPreviousPage: false,
    });
    expect(response.body.meta.total).toBeGreaterThan(0);
    expect(typeof response.body.meta.totalPages).toBe('number');
    expect(response.body.data[0]).toHaveProperty('ip');
    expect(response.body.data[0]).toHaveProperty('requestId');
  });

  it('filters audit logs by created period', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await insertAuditLog({
      action: 'OLD_EVENT',
      entity: 'Ticket',
      createdAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    await insertAuditLog({
      action: 'RECENT_EVENT',
      entity: 'Ticket',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    });

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({
        createdFrom: '2026-01-01T00:00:00.000Z',
        createdTo: '2026-12-31T23:59:59.999Z',
      })
      .expect(200);

    const actions = response.body.data.map(
      (log: { action: string }) => log.action,
    );
    expect(actions).toContain('RECENT_EVENT');
    expect(actions).not.toContain('OLD_EVENT');
  });

  it('returns 400 for an invalid ISO date', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ createdFrom: 'not-a-date' })
      .expect(400);
  });

  it('orders audit logs by createdAt asc and desc', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await insertAuditLog({
      action: 'FIRST',
      entity: 'Ticket',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    await insertAuditLog({
      action: 'SECOND',
      entity: 'Ticket',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    const asc = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ sortBy: 'createdAt', sortOrder: 'asc' })
      .expect(200);
    expect(asc.body.data[0].action).toBe('FIRST');

    const desc = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ sortBy: 'createdAt', sortOrder: 'desc' })
      .expect(200);
    expect(desc.body.data[0].action).toBe('SECOND');
  });

  it('searches audit logs by text (case-insensitive)', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await insertAuditLog({ action: 'ROLE_UPDATED', entity: 'Role' });
    await insertAuditLog({ action: 'TICKET_CREATED', entity: 'Ticket' });

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ search: 'role' })
      .expect(200);

    const entities = response.body.data.map(
      (log: { entity: string }) => log.entity,
    );
    expect(entities).toContain('Role');
    expect(entities).not.toContain('Ticket');
  });

  it('exposes ip and requestId from metadata at the top level', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await insertAuditLog({
      action: 'API_KEY_CREATED',
      entity: 'ApiKey',
      metadata: { ip: '203.0.113.10', requestId: 'req_abc123' },
    });

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs')
      .query({ search: 'API_KEY_CREATED' })
      .expect(200);

    const log = response.body.data.find(
      (item: { action: string }) => item.action === 'API_KEY_CREATED',
    );
    expect(log.ip).toBe('203.0.113.10');
    expect(log.requestId).toBe('req_abc123');
  });

  it('verifies the integrity of a valid chain (INTACT)', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    await createTicket(token, fixtures.tenantA.id);

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs/verify')
      .expect(200);

    const data = unwrapApiData(response.body) as {
      status: string;
      totalLogs: number;
      checkedAt: string;
      firstLogId: string | null;
      lastLogId: string | null;
      compromisedLogId: string | null;
      message: string;
      valid: boolean;
      totalVerified: number;
      firstInvalid: unknown;
    };

    expect(data.status).toBe('INTACT');
    expect(data.totalLogs).toBeGreaterThan(0);
    expect(data.firstLogId).toBeTruthy();
    expect(data.lastLogId).toBeTruthy();
    expect(data.compromisedLogId).toBeNull();
    expect(typeof data.checkedAt).toBe('string');
    // Backward-compatible legacy fields are preserved.
    expect(data.valid).toBe(true);
    expect(data.totalVerified).toBeGreaterThan(0);
    expect(data.firstInvalid).toBeNull();
  });

  it('returns EMPTY when there are no audit logs', async () => {
    const fixtures = await seedIntegrationFixtures();
    const token = await login(app, fixtures.adminA.email, fixtures.password);

    const response = await authRequest(app, token)
      .get('/api/v1/admin/audit-logs/verify')
      .expect(200);

    const data = unwrapApiData(response.body) as {
      status: string;
      totalLogs: number;
      firstLogId: string | null;
      lastLogId: string | null;
    };

    expect(data.status).toBe('EMPTY');
    expect(data.totalLogs).toBe(0);
    expect(data.firstLogId).toBeNull();
    expect(data.lastLogId).toBeNull();
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
      compromisedLogId: string | null;
      valid: boolean;
      firstInvalid: { id: string } | null;
    };

    expect(data.status).toBe('COMPROMISED');
    expect(data.compromisedLogId).toBe(first!.id);
    // Backward-compatible legacy fields are preserved.
    expect(data.valid).toBe(false);
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
