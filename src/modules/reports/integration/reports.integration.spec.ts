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
import {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split('\n')
    .map((line) => line.split(','));
}

describe.sequential('Reports CSV exports', () => {
  let app: Express;
  let tenant1Id: string;
  let agent1Id: string;
  let adminToken: string;
  let agentToken: string;
  let customerId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'Tenant 1 Reports',
        slug: 'tenant-1-reports',
      },
    });
    tenant1Id = tenant1.id;

    const admin = await prisma.user.create({
      data: {
        email: 'admin-reports@test.com',
        name: 'Admin Reports',
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

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-reports@test.com',
        name: 'Agent 1 Reports',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });
    agent1Id = agent1.id;

    agentToken = createAuthToken({
      id: agent1.id,
      email: agent1.email,
      role: UserRole.AGENT,
      tenantId: tenant1Id,
    });

    const customer = await prisma.customer.create({
      data: {
        email: 'customer-reports@test.com',
        name: 'Customer Reports',
        tenantId: tenant1Id,
      },
    });
    customerId = customer.id;

    const now = Date.now();

    await prisma.ticket.createMany({
      data: [
        {
          tenantId: tenant1Id,
          protocol: 'RP-001',
          title: 'Open report ticket',
          description: 'Open',
          status: TicketStatus.OPEN,
          priority: TicketPriority.HIGH,
          customerId,
          assignedToId: agent1Id,
          slaDueAt: new Date(now + 48 * 60 * 60 * 1000),
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        },
        {
          tenantId: tenant1Id,
          protocol: 'RP-002',
          title: 'Resolved report ticket',
          description: 'Resolved',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.MEDIUM,
          customerId,
          assignedToId: agent1Id,
          slaDueAt: new Date('2026-06-03T18:00:00.000Z'),
          closedAt: new Date('2026-06-03T14:00:00.000Z'),
          createdAt: new Date('2026-06-03T10:00:00.000Z'),
        },
      ],
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('GET /reports/tickets.csv should export tickets with csv headers', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/reports/tickets.csv',
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-disposition']).toContain('tickets.csv');

    const rows = parseCsv(response.text);
    expect(rows[0][0]).toBe('protocol');
    expect(rows).toHaveLength(3);
    expect(rows.some((row) => row[0] === 'RP-001')).toBe(true);
    expect(rows.some((row) => row[0] === 'RP-002')).toBe(true);
  });

  it('GET /reports/agents-performance.csv should export agent metrics', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/reports/agents-performance.csv',
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain(
      'agents-performance.csv',
    );

    const rows = parseCsv(response.text);
    expect(rows[0]).toContain('agentId');
    expect(rows[0]).toContain('avgResolutionTimeHours');
    expect(rows[1][1]).toBe('Agent 1 Reports');
    expect(Number(rows[1][2])).toBe(2);
    expect(Number(rows[1][3])).toBe(1);
  });

  it('GET /reports/sla.csv should export sla rows for tickets with slaDueAt', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/reports/sla.csv',
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('sla.csv');

    const rows = parseCsv(response.text);
    expect(rows[0][0]).toBe('protocol');
    expect(rows[0]).toContain('slaStatus');
    expect(rows).toHaveLength(3);
    expect(rows.some((row) => row[0] === 'RP-001')).toBe(true);
    expect(rows.some((row) => row[0] === 'RP-002')).toBe(true);
  });

  it('should deny report export for agents', async () => {
    const response = await authRequest(app, agentToken).get(
      '/api/v1/reports/tickets.csv',
    );

    expect(response.status).toBe(403);
  });

  it('should apply startDate and endDate filters to tickets export', async () => {
    const response = await authRequest(app, adminToken).get(
      '/api/v1/reports/tickets.csv?startDate=2026-06-03T00:00:00.000Z&endDate=2026-06-03T23:59:59.999Z',
    );

    expect(response.status).toBe(200);

    const rows = parseCsv(response.text);
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe('RP-002');
  });

  it('should apply agentId filter to tickets export', async () => {
    const otherAgent = await prisma.user.create({
      data: {
        email: 'agent2-reports@test.com',
        name: 'Agent 2 Reports',
        password: 'password',
        role: UserRole.AGENT,
        tenantId: tenant1Id,
      },
    });

    await prisma.ticket.create({
      data: {
        tenantId: tenant1Id,
        protocol: 'RP-003',
        title: 'Other agent ticket',
        description: 'Other',
        status: TicketStatus.OPEN,
        priority: TicketPriority.LOW,
        customerId,
        assignedToId: otherAgent.id,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
      },
    });

    const response = await authRequest(app, adminToken).get(
      `/api/v1/reports/tickets.csv?agentId=${agent1Id}`,
    );

    expect(response.status).toBe(200);

    const rows = parseCsv(response.text);
    expect(rows).toHaveLength(3);
    expect(rows.every((row, index) => index === 0 || row[0] !== 'RP-003')).toBe(
      true,
    );
  });
});
