import type { Prisma } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import type {
  AssignAgentAction,
  AssignTeamAction,
  AutomationAction,
  ChangePriorityAction,
  CloseTicketAction,
  SendNotificationAction,
} from '../../domain/automation-action.js';
import { AutomationActionType } from '../../domain/automation-action.js';
import type {
  AssignedToExistsCondition,
  AutomationCondition,
  CategoryEqualsCondition,
  PriorityEqualsCondition,
  StatusEqualsCondition,
  TicketAgeGreaterThanCondition,
} from '../../domain/automation-condition.js';
import { AutomationConditionType } from '../../domain/automation-condition.js';
import type {
  AutomationRule,
  AutomationRuleExecution,
} from '../../domain/automation-rule.entity.js';
import { AutomationExecutionStatus } from '../../domain/automation-rule.entity.js';
import type { AutomationTrigger } from '../../domain/automation-trigger.js';

function parseConditions(value: Prisma.JsonValue): AutomationCondition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): AutomationCondition[] => {
    if (!item || typeof item !== 'object' || !('type' in item)) {
      return [];
    }

    const record = item as Record<string, unknown>;

    switch (record.type) {
      case AutomationConditionType.PRIORITY_EQUALS:
        return [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: record.value,
          } as PriorityEqualsCondition,
        ];
      case AutomationConditionType.STATUS_EQUALS:
        return [
          {
            type: AutomationConditionType.STATUS_EQUALS,
            value: record.value,
          } as StatusEqualsCondition,
        ];
      case AutomationConditionType.CATEGORY_EQUALS:
        return [
          {
            type: AutomationConditionType.CATEGORY_EQUALS,
            value: String(record.value),
          } as CategoryEqualsCondition,
        ];
      case AutomationConditionType.ASSIGNED_TO_EXISTS:
        return [
          {
            type: AutomationConditionType.ASSIGNED_TO_EXISTS,
            value: Boolean(record.value),
          } as AssignedToExistsCondition,
        ];
      case AutomationConditionType.TICKET_AGE_GREATER_THAN:
        return [
          {
            type: AutomationConditionType.TICKET_AGE_GREATER_THAN,
            value: record.value as TicketAgeGreaterThanCondition['value'],
          },
        ];
      default:
        return [];
    }
  });
}

function parseActions(value: Prisma.JsonValue): AutomationAction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): AutomationAction[] => {
    if (!item || typeof item !== 'object' || !('type' in item)) {
      return [];
    }

    const record = item as Record<string, unknown>;

    switch (record.type) {
      case AutomationActionType.ASSIGN_AGENT:
        return [
          {
            type: AutomationActionType.ASSIGN_AGENT,
            agentId: String(record.agentId),
          } as AssignAgentAction,
        ];
      case AutomationActionType.ASSIGN_TEAM:
        return [
          {
            type: AutomationActionType.ASSIGN_TEAM,
            team: record.team,
          } as AssignTeamAction,
        ];
      case AutomationActionType.CHANGE_PRIORITY:
        return [
          {
            type: AutomationActionType.CHANGE_PRIORITY,
            priority: record.priority,
          } as ChangePriorityAction,
        ];
      case AutomationActionType.SEND_NOTIFICATION:
        return [
          {
            type: AutomationActionType.SEND_NOTIFICATION,
            title: String(record.title),
            message: String(record.message),
            recipientId: record.recipientId
              ? String(record.recipientId)
              : undefined,
          } as SendNotificationAction,
        ];
      case AutomationActionType.CLOSE_TICKET:
        return [
          { type: AutomationActionType.CLOSE_TICKET } as CloseTicketAction,
        ];
      default:
        return [];
    }
  });
}

function toAutomationRule(record: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  active: boolean;
  trigger: AutomationTrigger;
  conditions: Prisma.JsonValue;
  actions: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): AutomationRule {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    description: record.description,
    active: record.active,
    trigger: record.trigger,
    conditions: parseConditions(record.conditions),
    actions: parseActions(record.actions),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export type CreateAutomationRuleData = {
  tenantId: string;
  name: string;
  description?: string | null;
  active?: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

export type UpdateAutomationRuleData = {
  name?: string;
  description?: string | null;
  active?: boolean;
  trigger?: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
};

export class AutomationRulesRepository {
  async create(data: CreateAutomationRuleData): Promise<AutomationRule> {
    const record = await prisma.automationRule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        active: data.active ?? true,
        trigger: data.trigger,
        conditions: data.conditions,
        actions: data.actions,
      },
    });

    return toAutomationRule(record);
  }

  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<AutomationRule | null> {
    const record = await prisma.automationRule.findFirst({
      where: { id, tenantId },
    });

    return record ? toAutomationRule(record) : null;
  }

  async listByTenant(tenantId: string): Promise<AutomationRule[]> {
    const records = await prisma.automationRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toAutomationRule);
  }

  async listActiveByTenantAndTrigger(
    tenantId: string,
    trigger: AutomationTrigger,
  ): Promise<AutomationRule[]> {
    const records = await prisma.automationRule.findMany({
      where: {
        tenantId,
        active: true,
        trigger,
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toAutomationRule);
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateAutomationRuleData,
  ): Promise<AutomationRule> {
    const record = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.trigger !== undefined ? { trigger: data.trigger } : {}),
        ...(data.conditions !== undefined
          ? { conditions: data.conditions }
          : {}),
        ...(data.actions !== undefined ? { actions: data.actions } : {}),
      },
    });

    if (record.tenantId !== tenantId) {
      throw new Error('Automation rule tenant mismatch');
    }

    return toAutomationRule(record);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findByIdAndTenant(id, tenantId);
    if (!existing) {
      return;
    }

    await prisma.automationRule.delete({ where: { id } });
  }

  async createExecution(input: {
    tenantId: string;
    ruleId: string;
    ticketId: string;
    trigger: AutomationTrigger;
    status: AutomationExecutionStatus;
    details?: Record<string, unknown>;
  }): Promise<AutomationRuleExecution> {
    const record = await prisma.automationRuleExecution.create({
      data: {
        tenantId: input.tenantId,
        ruleId: input.ruleId,
        ticketId: input.ticketId,
        trigger: input.trigger,
        status: input.status,
        details: input.details as Prisma.InputJsonValue | undefined,
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      ruleId: record.ruleId,
      ticketId: record.ticketId,
      trigger: record.trigger,
      status: record.status,
      details: (record.details as Record<string, unknown> | null) ?? null,
      createdAt: record.createdAt,
    };
  }
}

export const automationRulesRepository = new AutomationRulesRepository();
