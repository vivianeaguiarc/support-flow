import type { Express } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../../app.js';
import { UserRole } from '../../../shared/types/user-role.js';
import {
  disconnectTestDatabase,
  integrationPrisma,
  migrateTestDatabase,
  resetTestDatabase,
} from '../../../test/integration/database.js';
import { seedIntegrationFixtures } from '../../../test/integration/fixtures.js';
import {
  authRequest,
  createAuthToken,
  login,
} from '../../../test/integration/http-client.js';
import { AutomationTrigger } from '../domain/automation-trigger.js';

describe.sequential('Automation rules integration', () => {
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

  it('should allow admin to manage automation rules', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const createResponse = await adminApi
      .post('/api/v1/automation/rules')
      .send({
        name: 'Atribuir alta prioridade',
        description: 'Atribui chamados HIGH ao agente principal',
        active: true,
        trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ type: 'priority_equals', value: 'HIGH' }],
        actions: [{ type: 'assign_agent', agentId: fixtures.agentA.id }],
      })
      .expect(201);

    const ruleId = createResponse.body.data.id as string;

    expect(createResponse.body.data).toMatchObject({
      name: 'Atribuir alta prioridade',
      trigger: AutomationTrigger.TICKET_CREATED,
      active: true,
    });

    const listResponse = await adminApi
      .get('/api/v1/automation/rules')
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].id).toBe(ruleId);

    await adminApi
      .patch(`/api/v1/automation/rules/${ruleId}`)
      .send({ active: false })
      .expect(200);

    const deleteResponse = await adminApi
      .del(`/api/v1/automation/rules/${ruleId}`)
      .expect(200);

    expect(deleteResponse.body.data).toEqual({ deleted: true });

    const emptyList = await adminApi
      .get('/api/v1/automation/rules')
      .expect(200);

    expect(emptyList.body.data).toHaveLength(0);
  });

  it('should forbid non-admin users from managing rules', async () => {
    const fixtures = await seedIntegrationFixtures();
    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const agentApi = authRequest(app, agentToken);

    await agentApi
      .post('/api/v1/automation/rules')
      .send({
        name: 'Regra proibida',
        trigger: AutomationTrigger.TICKET_CREATED,
        actions: [{ type: 'assign_agent', agentId: fixtures.agentA.id }],
      })
      .expect(403);

    await agentApi.get('/api/v1/automation/rules').expect(403);
  });

  it('should execute rule on ticket creation and audit execution', async () => {
    const fixtures = await seedIntegrationFixtures();
    const adminToken = createAuthToken({
      id: fixtures.adminA.id,
      email: fixtures.adminA.email,
      role: UserRole.ADMIN,
      tenantId: fixtures.tenantA.id,
    });
    const adminApi = authRequest(app, adminToken);

    const ruleResponse = await adminApi
      .post('/api/v1/automation/rules')
      .send({
        name: 'Auto assign on create',
        trigger: AutomationTrigger.TICKET_CREATED,
        conditions: [{ type: 'priority_equals', value: 'HIGH' }],
        actions: [{ type: 'assign_agent', agentId: fixtures.agentA.id }],
      })
      .expect(201);

    const ruleId = ruleResponse.body.data.id as string;

    const agentToken = await login(
      app,
      fixtures.agentA.email,
      fixtures.password,
    );
    const agentApi = authRequest(app, agentToken);

    const ticketResponse = await agentApi
      .post('/api/v1/tickets')
      .send({
        title: 'Chamado automatizado',
        description: 'Deve ser atribuído automaticamente',
        customerId: fixtures.customerA.id,
        priority: 'HIGH',
        categoryId: fixtures.categoryA.id,
      })
      .expect(201);

    const ticketId = ticketResponse.body.data.id as string;

    expect(ticketResponse.body.data.assignedToId).toBe(fixtures.agentA.id);

    const executions = await integrationPrisma.automationRuleExecution.findMany(
      {
        where: {
          tenantId: fixtures.tenantA.id,
          ruleId,
          ticketId,
        },
      },
    );

    expect(executions).toHaveLength(1);
    expect(executions[0]?.status).toBe('COMPLETED');
    expect(executions[0]?.trigger).toBe(AutomationTrigger.TICKET_CREATED);
  });
});
