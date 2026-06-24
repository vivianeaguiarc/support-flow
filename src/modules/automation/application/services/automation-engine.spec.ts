import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../feature-flags/application/services/feature-flag.service.js',
  () => ({
    featureFlagService: {
      isEnabled: vi.fn().mockResolvedValue(true),
    },
  }),
);

import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import {
  TicketPriority,
  TicketStatus,
} from '../../../tickets/domain/ticket-enums.js';
import { AutomationActionType } from '../../domain/automation-action.js';
import { AutomationConditionType } from '../../domain/automation-condition.js';
import type { AutomationRule } from '../../domain/automation-rule.entity.js';
import { AutomationExecutionStatus } from '../../domain/automation-rule.entity.js';
import { AutomationTrigger } from '../../domain/automation-trigger.js';
import type { AutomationRulesRepository } from '../../infrastructure/repositories/automation-rules.repository.js';
import type { AutomationActionExecutor } from './automation-action-executor.js';
import { AutomationEngine } from './automation-engine.js';

const baseTicket = (): Ticket => ({
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-20260624-ABC123',
  title: 'Test ticket',
  description: 'Description',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: null,
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date('2026-06-24T10:00:00.000Z'),
  updatedAt: new Date('2026-06-24T10:00:00.000Z'),
});

const baseRule = (overrides: Partial<AutomationRule> = {}): AutomationRule => ({
  id: 'rule-1',
  tenantId: 'tenant-1',
  name: 'Auto assign high priority',
  description: null,
  active: true,
  trigger: AutomationTrigger.TICKET_CREATED,
  conditions: [
    {
      type: AutomationConditionType.PRIORITY_EQUALS,
      value: TicketPriority.HIGH,
    },
  ],
  actions: [
    {
      type: AutomationActionType.ASSIGN_AGENT,
      agentId: 'agent-1',
    },
  ],
  createdAt: new Date('2026-06-24T09:00:00.000Z'),
  updatedAt: new Date('2026-06-24T09:00:00.000Z'),
  ...overrides,
});

describe('AutomationEngine', () => {
  let rulesRepository: AutomationRulesRepository;
  let actionExecutor: AutomationActionExecutor;
  let engine: AutomationEngine;

  beforeEach(() => {
    rulesRepository = {
      listActiveByTenantAndTrigger: vi.fn(),
      createExecution: vi.fn().mockResolvedValue({ id: 'execution-1' }),
    } as unknown as AutomationRulesRepository;

    actionExecutor = {
      executeAll: vi.fn().mockResolvedValue([
        {
          action: {
            type: AutomationActionType.ASSIGN_AGENT,
            agentId: 'agent-1',
          },
          success: true,
        },
      ]),
    } as unknown as AutomationActionExecutor;

    engine = new AutomationEngine(rulesRepository, actionExecutor);
  });

  it('should do nothing when no active rules exist', async () => {
    vi.mocked(rulesRepository.listActiveByTenantAndTrigger).mockResolvedValue(
      [],
    );

    await engine.processEventDirect({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      trigger: AutomationTrigger.TICKET_CREATED,
      ticket: baseTicket(),
    });

    expect(actionExecutor.executeAll).not.toHaveBeenCalled();
    expect(rulesRepository.createExecution).not.toHaveBeenCalled();
  });

  it('should skip rule when conditions do not match', async () => {
    vi.mocked(rulesRepository.listActiveByTenantAndTrigger).mockResolvedValue([
      baseRule({
        conditions: [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: TicketPriority.LOW,
          },
        ],
      }),
    ]);

    await engine.processEventDirect({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      trigger: AutomationTrigger.TICKET_CREATED,
      ticket: baseTicket(),
    });

    expect(actionExecutor.executeAll).not.toHaveBeenCalled();
    expect(rulesRepository.createExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AutomationExecutionStatus.SKIPPED,
        details: { reason: 'conditions_not_met' },
      }),
    );
  });

  it('should execute actions and record completed execution', async () => {
    vi.mocked(rulesRepository.listActiveByTenantAndTrigger).mockResolvedValue([
      baseRule(),
    ]);

    await engine.processEventDirect({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      trigger: AutomationTrigger.TICKET_CREATED,
      ticket: baseTicket(),
    });

    expect(actionExecutor.executeAll).toHaveBeenCalledWith(
      baseRule().actions,
      baseTicket(),
    );
    expect(rulesRepository.createExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AutomationExecutionStatus.COMPLETED,
        ruleId: 'rule-1',
        ticketId: 'ticket-1',
      }),
    );
  });

  it('should record failed execution when actions fail', async () => {
    vi.mocked(rulesRepository.listActiveByTenantAndTrigger).mockResolvedValue([
      baseRule(),
    ]);
    vi.mocked(actionExecutor.executeAll).mockResolvedValue([
      {
        action: {
          type: AutomationActionType.ASSIGN_AGENT,
          agentId: 'agent-1',
        },
        success: false,
        message: 'Agent not found',
      },
    ]);

    await engine.processEventDirect({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      trigger: AutomationTrigger.TICKET_CREATED,
      ticket: baseTicket(),
    });

    expect(rulesRepository.createExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AutomationExecutionStatus.FAILED,
      }),
    );
  });
});
