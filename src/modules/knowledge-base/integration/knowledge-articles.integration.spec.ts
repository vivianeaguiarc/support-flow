import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { hashPassword } from '../../../shared/security/password-hash.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  integrationPrisma,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import {
  authRequest,
  createAuthToken,
} from '../../../test/integration/http-client.js';
import { KnowledgeArticleStatus } from '../domain/knowledge-article-enums.js';

describe.sequential('Knowledge articles integration', () => {
  let app: Express;
  let tenantId: string;
  let adminToken: string;
  let supervisorToken: string;
  let agentToken: string;
  let customerToken: string;

  beforeAll(async () => {
    await migrateTestDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    const password = await hashPassword('Password123!');

    const tenant = await integrationPrisma.tenant.create({
      data: {
        id: DEFAULT_TENANT_ID,
        name: 'Knowledge Tenant',
        slug: `knowledge-tenant-${Date.now()}`,
      },
    });
    tenantId = tenant.id;

    const admin = await integrationPrisma.user.create({
      data: {
        tenantId,
        name: 'Admin KB',
        email: `admin-kb-${Date.now()}@supportflow.test`,
        password,
        role: UserRole.ADMIN,
      },
    });

    const supervisor = await integrationPrisma.user.create({
      data: {
        tenantId,
        name: 'Supervisor KB',
        email: `supervisor-kb-${Date.now()}@supportflow.test`,
        password,
        role: UserRole.SUPERVISOR,
      },
    });

    const agent = await integrationPrisma.user.create({
      data: {
        tenantId,
        name: 'Agent KB',
        email: `agent-kb-${Date.now()}@supportflow.test`,
        password,
        role: UserRole.AGENT,
      },
    });

    const customer = await integrationPrisma.customer.create({
      data: {
        tenantId,
        name: 'Customer KB',
        email: `customer-kb-${Date.now()}@supportflow.test`,
      },
    });

    adminToken = createAuthToken({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      tenantId,
    });
    supervisorToken = createAuthToken({
      id: supervisor.id,
      email: supervisor.email,
      role: UserRole.SUPERVISOR,
      tenantId,
    });
    agentToken = createAuthToken({
      id: agent.id,
      email: agent.email,
      role: UserRole.AGENT,
      tenantId,
    });
    customerToken = createAuthToken({
      id: customer.id,
      email: customer.email,
      role: UserRole.CUSTOMER,
      tenantId,
    });
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it('should allow admin to create, publish and list article publicly', async () => {
    const createResponse = await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Como abrir um chamado',
        content: 'Passo a passo para abrir chamados.',
        category: 'Atendimento',
      })
      .expect(201);

    const articleId = createResponse.body.data.id;
    expect(createResponse.body.data.status).toBe(KnowledgeArticleStatus.DRAFT);
    expect(createResponse.body.data.slug).toBe('como-abrir-um-chamado');

    await authRequest(app, adminToken)
      .get('/api/v1/knowledge/articles/como-abrir-um-chamado')
      .expect(200);

    await authRequest(app, customerToken)
      .get('/api/v1/knowledge/articles')
      .expect(200)
      .then((response) => {
        expect(response.body.data).toHaveLength(0);
      });

    await authRequest(app, adminToken)
      .patch(`/api/v1/knowledge/articles/${articleId}/publish`)
      .expect(200);

    const publicList = await authRequest(app, customerToken)
      .get('/api/v1/knowledge/articles')
      .expect(200);

    expect(publicList.body.data).toHaveLength(1);
    expect(publicList.body.data[0].slug).toBe('como-abrir-um-chamado');

    const anonymousList = await authRequest(app)
      .get('/api/v1/knowledge/articles?search=chamado')
      .expect(200);

    expect(anonymousList.body.data).toHaveLength(1);
  });

  it('should block agent from creating articles', async () => {
    await authRequest(app, agentToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Artigo proibido',
        content: 'Conteúdo',
        category: 'Suporte',
      })
      .expect(403);
  });

  it('should allow supervisor to update and archive article', async () => {
    const created = await authRequest(app, supervisorToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Política de SLA',
        slug: 'politica-sla',
        content: 'Detalhes de SLA',
        category: 'SLA',
      })
      .expect(201);

    await authRequest(app, supervisorToken)
      .patch(`/api/v1/knowledge/articles/${created.body.data.id}`)
      .send({ title: 'Política de SLA atualizada' })
      .expect(200);

    await authRequest(app, supervisorToken)
      .patch(`/api/v1/knowledge/articles/${created.body.data.id}/publish`)
      .expect(200);

    await authRequest(app, supervisorToken)
      .patch(`/api/v1/knowledge/articles/${created.body.data.id}/archive`)
      .expect(200);

    const publicList = await authRequest(app)
      .get('/api/v1/knowledge/articles')
      .expect(200);

    expect(publicList.body.data).toHaveLength(0);

    const staffList = await authRequest(app, supervisorToken)
      .get('/api/v1/knowledge/articles?status=ARCHIVED')
      .expect(200);

    expect(staffList.body.data).toHaveLength(1);
  });

  it('should hide draft from public slug lookup and allow admin preview', async () => {
    const created = await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Rascunho interno',
        slug: 'rascunho-interno',
        content: 'Somente equipe',
        category: 'Interno',
      })
      .expect(201);

    await authRequest(app)
      .get('/api/v1/knowledge/articles/rascunho-interno')
      .expect(404);

    await authRequest(app, adminToken)
      .get('/api/v1/knowledge/articles/rascunho-interno')
      .expect(200);

    await authRequest(app, adminToken)
      .del(`/api/v1/knowledge/articles/${created.body.data.id}`)
      .expect(200);
  });

  it('should enforce unique slug per tenant', async () => {
    await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Primeiro artigo',
        slug: 'artigo-unico',
        content: 'Conteúdo 1',
        category: 'FAQ',
      })
      .expect(201);

    const second = await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Segundo artigo',
        slug: 'artigo-unico',
        content: 'Conteúdo 2',
        category: 'FAQ',
      })
      .expect(201);

    expect(second.body.data.slug).toBe('artigo-unico-2');
  });

  it('should filter articles by category for staff', async () => {
    const draftA = await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Artigo A',
        content: 'A',
        category: 'Categoria A',
      })
      .expect(201);

    await authRequest(app, adminToken)
      .post('/api/v1/knowledge/articles')
      .send({
        title: 'Artigo B',
        content: 'B',
        category: 'Categoria B',
      })
      .expect(201);

    const filtered = await authRequest(app, adminToken)
      .get('/api/v1/knowledge/articles?category=Categoria%20A&status=DRAFT')
      .expect(200);

    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].id).toBe(draftA.body.data.id);
    expect(filtered.body.meta.total).toBe(1);
  });
});
