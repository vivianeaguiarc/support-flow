import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { createAuthToken } from '../../../test/integration/http-client.js';
import {
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../domain/ticket-enums.js';

describe.sequential('Ticket Priority', () => {
  const app = createApp();
  let tenantId: string;
  let agentId: string;
  let customerId: string;
  let agentToken: string;
  let categoryReclamacaoId: string;
  let categoryOuvidoriaId: string;

  beforeAll(async () => {
    await migrateTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();

    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant Priority', slug: 'tenant-priority' },
    });
    tenantId = tenant.id;

    const agent = await prisma.user.create({
      data: {
        email: 'agent-priority@test.com',
        name: 'Agent Priority',
        password: 'password',
        role: UserRole.AGENT,
        tenantId,
      },
    });
    agentId = agent.id;
    agentToken = createAuthToken(agent);

    const customer = await prisma.customer.create({
      data: {
        email: 'customer-priority@test.com',
        name: 'Customer Priority',
        tenantId,
      },
    });
    customerId = customer.id;

    const categoryReclamacao = await prisma.ticketCategory.create({
      data: {
        tenantId,
        name: 'Reclamação',
        description: 'Categoria de reclamações',
      },
    });
    categoryReclamacaoId = categoryReclamacao.id;

    const categoryOuvidoria = await prisma.ticketCategory.create({
      data: {
        tenantId,
        name: 'Ouvidoria',
        description: 'Categoria de ouvidoria',
      },
    });
    categoryOuvidoriaId = categoryOuvidoria.id;
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  describe('POST /tickets - Automatic Priority', () => {
    it('should set priority to URGENT when critical keywords are detected', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'URGENTE: Fraude detectada',
          description: 'Preciso resolver isso imediatamente',
          customerId,
          priority: TicketPriority.LOW,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: response.body.id,
          event: TicketHistoryEvent.PRIORITY_CHANGED,
        },
      });

      expect(history).toHaveLength(1);
      expect(history[0].oldValue).toBe(TicketPriority.LOW);
      expect(history[0].newValue).toBe(TicketPriority.URGENT);
    });

    it('should set priority to URGENT for data breach keywords', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Vazamento de dados pessoais',
          description: 'Detectamos um problema grave',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });

    it('should set priority to URGENT for billing fraud', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Cobrança indevida na fatura',
          description: 'Estou sendo cobrado por serviço não contratado',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });

    it('should set priority to HIGH for ombudsman category', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Solicitação via ouvidoria',
          description: 'Preciso de assistência',
          customerId,
          categoryId: categoryOuvidoriaId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.HIGH);
    });

    it('should set priority to MEDIUM for complaint category', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Reclamação sobre atendimento',
          description: 'O atendimento foi ruim',
          customerId,
          categoryId: categoryReclamacaoId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.MEDIUM);
    });

    it('should set priority to MEDIUM when complaint keyword is detected', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Quero fazer uma reclamação',
          description: 'Estou insatisfeito com o serviço',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.MEDIUM);
    });

    it('should prioritize critical keywords over category', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Fraude urgente',
          description: 'Vazamento de dados crítico',
          customerId,
          categoryId: categoryReclamacaoId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });

    it('should use LOW priority when no rules match', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Dúvida simples',
          description: 'Tenho uma pergunta',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.LOW);
    });
  });

  describe('PATCH /tickets/:id/recalculate-priority', () => {
    it('should recalculate priority based on title and description', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'PRI-001',
          title: 'Urgente: fraude detectada',
          description: 'Vazamento de dados',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/recalculate-priority`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.priority).toBe(TicketPriority.URGENT);

      const history = await prisma.ticketHistory.findFirst({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.PRIORITY_CHANGED,
        },
      });

      expect(history).toBeDefined();
      expect(history?.changedById).toBe(agentId);
    });

    it('should not change priority if already optimal', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'PRI-002',
          title: 'Dúvida simples',
          description: 'Pergunta básica',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/recalculate-priority`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.priority).toBe(TicketPriority.LOW);

      const history = await prisma.ticketHistory.findMany({
        where: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.PRIORITY_CHANGED,
        },
      });

      expect(history).toHaveLength(0);
    });

    it('should not reduce manually set high priority', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'PRI-003',
          title: 'Dúvida simples',
          description: 'Pergunta básica',
          status: TicketStatus.OPEN,
          priority: TicketPriority.URGENT,
          customerId,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          tenantId,
          ticketId: ticket.id,
          event: TicketHistoryEvent.PRIORITY_CHANGED,
          field: 'priority',
          oldValue: TicketPriority.LOW,
          newValue: TicketPriority.URGENT,
          changedById: agentId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/recalculate-priority`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });

    it('should force recalculation when requested', async () => {
      const ticket = await prisma.ticket.create({
        data: {
          tenantId,
          protocol: 'PRI-004',
          title: 'Dúvida simples',
          description: 'Pergunta básica',
          status: TicketStatus.OPEN,
          priority: TicketPriority.URGENT,
          customerId,
        },
      });

      await prisma.ticketHistory.create({
        data: {
          tenantId,
          ticketId: ticket.id,
          event: TicketHistoryEvent.PRIORITY_CHANGED,
          field: 'priority',
          oldValue: TicketPriority.LOW,
          newValue: TicketPriority.URGENT,
          changedById: agentId,
        },
      });

      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/recalculate-priority`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ forceRecalculation: true })
        .expect(200);

      expect(response.body.priority).toBe(TicketPriority.LOW);
    });

    it('should respect tenant isolation', async () => {
      const tenant2 = await prisma.tenant.create({
        data: { name: 'Tenant 2', slug: 'tenant-2-priority' },
      });

      const customer2 = await prisma.customer.create({
        data: {
          email: 'customer2-priority@test.com',
          name: 'Customer 2',
          tenantId: tenant2.id,
        },
      });

      const ticket = await prisma.ticket.create({
        data: {
          tenantId: tenant2.id,
          protocol: 'PRI-005',
          title: 'Urgente',
          description: 'Test',
          status: TicketStatus.OPEN,
          priority: TicketPriority.LOW,
          customerId: customer2.id,
        },
      });

      await request(app)
        .patch(`/api/v1/tickets/${ticket.id}/recalculate-priority`)
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent ticket', async () => {
      await request(app)
        .patch(
          '/api/v1/tickets/00000000-0000-0000-0000-000000000000/recalculate-priority',
        )
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(404);
    });
  });

  describe('Multiple Keywords', () => {
    it('should detect multiple critical keywords', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Cancelamento não realizado',
          description: 'Situação grave e urgente',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });

    it('should handle case-insensitive keywords', async () => {
      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'URGENTE - FRAUDE',
          description: 'VAZAMENTO DE DADOS',
          customerId,
        })
        .expect(201);

      expect(response.body.priority).toBe(TicketPriority.URGENT);
    });
  });
});
