import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { prisma } from '../../../shared/database/prisma.js';
import { API_KEY_PREFIX } from '../../../shared/security/api-key.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  apiKeyRequest,
  authRequest,
  createAuthToken,
  login,
} from '../../../test/integration/http-client.js';
import { KnowledgeArticleStatus } from '../../knowledge-base/domain/knowledge-article-enums.js';

describe.sequential('API Keys integration', () => {
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

  it('should allow admin to create, list, revoke and delete API keys', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const createResponse = await adminApi
      .post('/api/v1/api-keys')
      .send({ name: 'Integração ERP' })
      .expect(201);

    const apiKeyId = createResponse.body.data.id as string;
    const fullKey = createResponse.body.data.key as string;

    expect(fullKey.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(createResponse.body.data.prefix).toBeTruthy();
    expect(createResponse.body.data.name).toBe('Integração ERP');

    const listResponse = await adminApi.get('/api/v1/api-keys').expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(apiKeyId);
    expect(listResponse.body.data[0].key).toBeUndefined();

    await adminApi.patch(`/api/v1/api-keys/${apiKeyId}/revoke`).expect(200);

    const revoked = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    expect(revoked?.active).toBe(false);

    await adminApi.del(`/api/v1/api-keys/${apiKeyId}`).expect(200);

    const emptyList = await adminApi.get('/api/v1/api-keys').expect(200);
    expect(emptyList.body.data).toHaveLength(0);
  });

  it('should forbid non-admin from managing API keys', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );

    await authRequest(app, agentToken)
      .post('/api/v1/api-keys')
      .send({ name: 'Forbidden key' })
      .expect(403);

    await authRequest(app, agentToken).get('/api/v1/api-keys').expect(403);
  });

  it('should authenticate integration requests with valid API key', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });

    const createResponse = await authRequest(app, adminToken)
      .post('/api/v1/api-keys')
      .send({ name: 'Knowledge integration' })
      .expect(201);

    const fullKey = createResponse.body.data.key as string;
    const apiKeyId = createResponse.body.data.id as string;

    await prisma.knowledgeArticle.create({
      data: {
        tenantId: fixtures.tenantA.id,
        title: 'Artigo integração',
        slug: 'artigo-integracao',
        content: 'Conteúdo publicado via API Key',
        status: KnowledgeArticleStatus.PUBLISHED,
        category: 'Integração',
        authorId: fixtures.adminA.id,
        publishedAt: new Date(),
      },
    });

    const listResponse = await apiKeyRequest(app, fullKey)
      .get('/api/v1/knowledge/articles')
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].title).toBe('Artigo integração');

    const updated = await prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    expect(updated?.lastUsedAt).not.toBeNull();
  });

  it('should reject invalid or revoked API keys', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });

    const createResponse = await authRequest(app, adminToken)
      .post('/api/v1/api-keys')
      .send({ name: 'Revoked key' })
      .expect(201);

    const fullKey = createResponse.body.data.key as string;
    const apiKeyId = createResponse.body.data.id as string;

    await authRequest(app, adminToken)
      .patch(`/api/v1/api-keys/${apiKeyId}/revoke`)
      .expect(200);

    await apiKeyRequest(app, fullKey)
      .get('/api/v1/knowledge/articles')
      .expect(401);

    await apiKeyRequest(app, `${API_KEY_PREFIX}invalidsecretvalue1234567890`)
      .get('/api/v1/knowledge/articles')
      .expect(401);
  });
});
