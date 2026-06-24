import type { AutomationAction } from './automation-action.js';
import type { AutomationCondition } from './automation-condition.js';
import type { AutomationTrigger } from './automation-trigger.js';

export type AutomationRule = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  active: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: Date;
  updatedAt: Date;
};

export const AutomationExecutionStatus = {
  MATCHED: 'MATCHED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

export type AutomationExecutionStatus =
  (typeof AutomationExecutionStatus)[keyof typeof AutomationExecutionStatus];

export type AutomationRuleExecution = {
  id: string;
  tenantId: string;
  ruleId: string;
  ticketId: string;
  trigger: AutomationTrigger;
  status: AutomationExecutionStatus;
  details: Record<string, unknown> | null;
  createdAt: Date;
};
