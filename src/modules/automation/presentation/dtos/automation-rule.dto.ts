import { z } from 'zod';

import { TICKET_PRIORITIES } from '../../../tickets/domain/ticket-enums.js';
import { TICKET_STATUSES } from '../../../tickets/domain/ticket-enums.js';
import { ASSIGNEE_TEAM_ROLES } from '../../../tickets/domain/ticket-queue-filters.js';
import { AutomationActionType } from '../../domain/automation-action.js';
import { AutomationConditionType } from '../../domain/automation-condition.js';
import { AUTOMATION_TRIGGERS } from '../../domain/automation-trigger.js';

const automationConditionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(AutomationConditionType.PRIORITY_EQUALS),
    value: z.enum(TICKET_PRIORITIES),
  }),
  z.object({
    type: z.literal(AutomationConditionType.STATUS_EQUALS),
    value: z.enum(TICKET_STATUSES),
  }),
  z.object({
    type: z.literal(AutomationConditionType.CATEGORY_EQUALS),
    value: z.uuid('Invalid category ID'),
  }),
  z.object({
    type: z.literal(AutomationConditionType.ASSIGNED_TO_EXISTS),
    value: z.boolean(),
  }),
  z.object({
    type: z.literal(AutomationConditionType.TICKET_AGE_GREATER_THAN),
    value: z.object({
      hours: z.number().positive(),
    }),
  }),
]);

const automationActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(AutomationActionType.ASSIGN_AGENT),
    agentId: z.uuid('Invalid agent ID'),
  }),
  z.object({
    type: z.literal(AutomationActionType.ASSIGN_TEAM),
    team: z.enum(ASSIGNEE_TEAM_ROLES),
  }),
  z.object({
    type: z.literal(AutomationActionType.CHANGE_PRIORITY),
    priority: z.enum(TICKET_PRIORITIES),
  }),
  z.object({
    type: z.literal(AutomationActionType.SEND_NOTIFICATION),
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(500),
    recipientId: z.uuid('Invalid recipient ID').optional(),
  }),
  z.object({
    type: z.literal(AutomationActionType.CLOSE_TICKET),
  }),
]);

export const createAutomationRuleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  active: z.boolean().optional(),
  trigger: z.enum(AUTOMATION_TRIGGERS),
  conditions: z.array(automationConditionSchema).default([]),
  actions: z.array(automationActionSchema).min(1),
});

export const updateAutomationRuleSchema = createAutomationRuleSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const automationRuleIdParamSchema = z.object({
  id: z.uuid('Invalid automation rule ID'),
});

export type CreateAutomationRuleDto = z.infer<
  typeof createAutomationRuleSchema
>;
export type UpdateAutomationRuleDto = z.infer<
  typeof updateAutomationRuleSchema
>;
