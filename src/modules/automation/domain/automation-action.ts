import type { TicketPriority } from '../../tickets/domain/ticket-enums.js';
import type { AssigneeTeamRole } from '../../tickets/domain/ticket-queue-filters.js';

export const AutomationActionType = {
  ASSIGN_AGENT: 'assign_agent',
  ASSIGN_TEAM: 'assign_team',
  CHANGE_PRIORITY: 'change_priority',
  SEND_NOTIFICATION: 'send_notification',
  CLOSE_TICKET: 'close_ticket',
} as const;

export type AutomationActionType =
  (typeof AutomationActionType)[keyof typeof AutomationActionType];

export type AssignAgentAction = {
  type: typeof AutomationActionType.ASSIGN_AGENT;
  agentId: string;
};

export type AssignTeamAction = {
  type: typeof AutomationActionType.ASSIGN_TEAM;
  team: AssigneeTeamRole;
};

export type ChangePriorityAction = {
  type: typeof AutomationActionType.CHANGE_PRIORITY;
  priority: TicketPriority;
};

export type SendNotificationAction = {
  type: typeof AutomationActionType.SEND_NOTIFICATION;
  title: string;
  message: string;
  recipientId?: string;
};

export type CloseTicketAction = {
  type: typeof AutomationActionType.CLOSE_TICKET;
};

export type AutomationAction =
  | AssignAgentAction
  | AssignTeamAction
  | ChangePriorityAction
  | SendNotificationAction
  | CloseTicketAction;
