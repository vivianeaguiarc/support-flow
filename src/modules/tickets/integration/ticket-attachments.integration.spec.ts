import fs from 'node:fs/promises';
import path from 'node:path';

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
  samplePdfBuffer,
  samplePngBuffer,
  sampleTxtBuffer,
} from '../../../test/integration/file-fixtures.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { TicketStatus } from '../domain/ticket-enums.js';

describe.sequential('Ticket Attachments', () => {
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

    const storageDir = path.join(process.cwd(), 'storage', 'attachments');
    try {
      await fs.access(storageDir);
    } catch {
      await fs.mkdir(storageDir, { recursive: true });
    }
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant1 = await prisma.tenant.create({
      data: { name: 'Tenant 1 Attachments', slug: 'tenant-1-attachments' },
    });
    tenant1Id = tenant1.id;

    const tenant2 = await prisma.tenant.create({
      data: { name: 'Tenant 2 Attachments', slug: 'tenant-2-attachments' },
    });
    tenant2Id = tenant2.id;

    const agent1 = await prisma.user.create({
      data: {
        email: 'agent1-attach@test.com',
        name: 'Agent 1 Attach',
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
        email: 'agent2-attach@test.com',
        name: 'Agent 2 Attach',
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
        email: 'admin-attach@test.com',
        name: 'Admin Attach',
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
        email: 'customer1-attach@test.com',
        name: 'Customer 1 Attach',
        tenantId: tenant1Id,
      },
    });
    customer1Id = customer1.id;

    customerToken = createAuthToken({
      id: customer1Id,
      email: 'customer1-attach@test.com',
      role: UserRole.CUSTOMER,
      tenantId: tenant1Id,
    });

    const ticket1 = await prisma.ticket.create({
      data: {
        tenantId: tenant1Id,
        protocol: 'TA-001',
        title: 'Test Ticket 1',
        description: 'Test Description 1',
        status: TicketStatus.OPEN,
        customerId: customer1Id,
      },
    });
    ticket1Id = ticket1.id;

    const customer2 = await prisma.customer.create({
      data: {
        email: 'customer2-attach@test.com',
        name: 'Customer 2 Attach',
        tenantId: tenant2Id,
      },
    });

    const ticket2 = await prisma.ticket.create({
      data: {
        tenantId: tenant2Id,
        protocol: 'TA-002',
        title: 'Test Ticket 2',
        description: 'Test Description 2',
        status: TicketStatus.OPEN,
        customerId: customer2.id,
      },
    });
    ticket2Id = ticket2.id;
  });

  afterAll(async () => {
    const storageDir = path.join(process.cwd(), 'storage', 'attachments');
    try {
      const files = await fs.readdir(storageDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(storageDir, file))),
      );
    } catch {
      // Ignore cleanup errors
    }

    await disconnectTestDatabase();
  });

  describe('POST /tickets/:id/attachments', () => {
    it('should upload PDF file as agent', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', samplePdfBuffer, 'test.pdf');

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        ticketId: ticket1Id,
        tenantId: tenant1Id,
        uploadedById: agent1Id,
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.fileName).toBeDefined();
      expect(response.body.storagePath).toBeDefined();
    });

    it('should upload PNG image as admin', async () => {
      const api = authRequest(app, adminToken);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', samplePngBuffer, 'screenshot.png');

      expect(response.status).toBe(201);
      expect(response.body.originalName).toBe('screenshot.png');
      expect(response.body.mimeType).toBe('image/png');
    });

    it('should record ATTACHMENT_ADDED in history', async () => {
      const api = authRequest(app, agent1Token);
      await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', sampleTxtBuffer, 'doc.txt');

      const history = await prisma.ticketHistory.findMany({
        where: { ticketId: ticket1Id, event: 'ATTACHMENT_ADDED' },
      });

      expect(history).toHaveLength(1);
      expect(history[0].field).toBe('attachment');
      expect(history[0].newValue).toBe('doc.txt');
    });

    it('should deny customer from uploading', async () => {
      const api = authRequest(app, customerToken);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', sampleTxtBuffer, 'test.pdf');

      expect(response.status).toBe(403);
    });

    it('should deny agent from different tenant', async () => {
      const api = authRequest(app, agent2Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', sampleTxtBuffer, 'test.pdf');

      expect(response.status).toBe(403);
    });

    it('should return 400 for non-allowed file type', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${ticket1Id}/attachments`)
        .attach('file', Buffer.from('exe'), 'virus.exe');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not allowed');
    });

    it('should return 400 for missing file', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.post(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 404 for non-existent ticket', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const api = authRequest(app, agent1Token);
      const response = await api
        .post(`/api/v1/tickets/${fakeId}/attachments`)
        .attach('file', sampleTxtBuffer, 'test.pdf');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /tickets/:id/attachments', () => {
    beforeEach(async () => {
      await prisma.ticketAttachment.createMany({
        data: [
          {
            tenantId: tenant1Id,
            ticketId: ticket1Id,
            uploadedById: agent1Id,
            fileName: 'file1.pdf',
            originalName: 'document1.pdf',
            mimeType: 'application/pdf',
            size: BigInt(1024),
            storagePath: 'storage/attachments/file1.pdf',
            createdAt: new Date('2026-01-01T10:00:00Z'),
          },
          {
            tenantId: tenant1Id,
            ticketId: ticket1Id,
            uploadedById: agent1Id,
            fileName: 'file2.png',
            originalName: 'image1.png',
            mimeType: 'image/png',
            size: BigInt(2048),
            storagePath: 'storage/attachments/file2.png',
            createdAt: new Date('2026-01-01T11:00:00Z'),
          },
        ],
      });
    });

    it('should list attachments ordered by creation', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].originalName).toBe('document1.pdf');
      expect(response.body[1].originalName).toBe('image1.png');
    });

    it('should include uploader information', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(200);
      expect(response.body[0].uploadedBy).toMatchObject({
        id: agent1Id,
        name: 'Agent 1 Attach',
        email: 'agent1-attach@test.com',
      });
    });

    it('should return empty array for ticket without attachments', async () => {
      await prisma.ticketAttachment.deleteMany({
        where: { ticketId: ticket1Id },
      });

      const api = authRequest(app, agent1Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should allow customer to view attachments', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should deny agent from different tenant', async () => {
      const api = authRequest(app, agent2Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(403);
    });

    it('should isolate attachments by tenant', async () => {
      await prisma.ticketAttachment.create({
        data: {
          tenantId: tenant2Id,
          ticketId: ticket2Id,
          uploadedById: agent2Id,
          fileName: 'file_t2.pdf',
          originalName: 'tenant2.pdf',
          mimeType: 'application/pdf',
          size: BigInt(1024),
          storagePath: 'storage/attachments/file_t2.pdf',
        },
      });

      const api = authRequest(app, agent1Token);
      const response = await api.get(
        `/api/v1/tickets/${ticket1Id}/attachments`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(
        response.body.every(
          (a: { originalName: string }) => a.originalName !== 'tenant2.pdf',
        ),
      ).toBe(true);
    });
  });

  describe('DELETE /tickets/:id/attachments/:attachmentId', () => {
    let attachmentId: string;

    beforeEach(async () => {
      const attachment = await prisma.ticketAttachment.create({
        data: {
          tenantId: tenant1Id,
          ticketId: ticket1Id,
          uploadedById: agent1Id,
          fileName: 'to_delete.pdf',
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          size: BigInt(1024),
          storagePath: 'storage/attachments/to_delete.pdf',
        },
      });
      attachmentId = attachment.id;

      await fs.writeFile(
        path.join(process.cwd(), attachment.storagePath),
        'test content',
      );
    });

    it('should delete attachment as agent', async () => {
      const api = authRequest(app, agent1Token);
      const response = await api.del(
        `/api/v1/tickets/${ticket1Id}/attachments/${attachmentId}`,
      );

      expect(response.status).toBe(204);

      const deleted = await prisma.ticketAttachment.findUnique({
        where: { id: attachmentId },
      });
      expect(deleted).toBeNull();
    });

    it('should record ATTACHMENT_REMOVED in history', async () => {
      const api = authRequest(app, agent1Token);
      await api.del(`/api/v1/tickets/${ticket1Id}/attachments/${attachmentId}`);

      const history = await prisma.ticketHistory.findMany({
        where: { ticketId: ticket1Id, event: 'ATTACHMENT_REMOVED' },
      });

      expect(history).toHaveLength(1);
      expect(history[0].field).toBe('attachment');
      expect(history[0].oldValue).toBe('document.pdf');
    });

    it('should allow admin to delete attachment', async () => {
      const api = authRequest(app, adminToken);
      const response = await api.del(
        `/api/v1/tickets/${ticket1Id}/attachments/${attachmentId}`,
      );

      expect(response.status).toBe(204);
    });

    it('should deny customer from deleting', async () => {
      const api = authRequest(app, customerToken);
      const response = await api.del(
        `/api/v1/tickets/${ticket1Id}/attachments/${attachmentId}`,
      );

      expect(response.status).toBe(403);
    });

    it('should deny agent from different tenant', async () => {
      const api = authRequest(app, agent2Token);
      const response = await api.del(
        `/api/v1/tickets/${ticket1Id}/attachments/${attachmentId}`,
      );

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent attachment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const api = authRequest(app, agent1Token);
      const response = await api.del(
        `/api/v1/tickets/${ticket1Id}/attachments/${fakeId}`,
      );

      expect(response.status).toBe(404);
    });
  });
});
