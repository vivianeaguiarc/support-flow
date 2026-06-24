import type {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

export const AutomationConditionType = {
  PRIORITY_EQUALS: 'priority_equals',
  STATUS_EQUALS: 'status_equals',
  CATEGORY_EQUALS: 'category_equals',
  ASSIGNED_TO_EXISTS: 'assigned_to_exists',
  TICKET_AGE_GREATER_THAN: 'ticket_age_greater_than',
} as const;

export type AutomationConditionType =
  (typeof AutomationConditionType)[keyof typeof AutomationConditionType];

export type PriorityEqualsCondition = {
  type: typeof AutomationConditionType.PRIORITY_EQUALS;
  value: TicketPriority;
};

export type StatusEqualsCondition = {
  type: typeof AutomationConditionType.STATUS_EQUALS;
  value: TicketStatus;
};

export type CategoryEqualsCondition = {
  type: typeof AutomationConditionType.CATEGORY_EQUALS;
  value: string;
};

export type AssignedToExistsCondition = {
  type: typeof AutomationConditionType.ASSIGNED_TO_EXISTS;
  value: boolean;
};

export type TicketAgeGreaterThanCondition = {
  type: typeof AutomationConditionType.TICKET_AGE_GREATER_THAN;
  value: { hours: number };
};

export type AutomationCondition =
  | PriorityEqualsCondition
  | StatusEqualsCondition
  | CategoryEqualsCondition
  | AssignedToExistsCondition
  | TicketAgeGreaterThanCondition;
