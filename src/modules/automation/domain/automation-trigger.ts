export const AutomationTrigger = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_BREACHED: 'SLA_BREACHED',
} as const;

export type AutomationTrigger =
  (typeof AutomationTrigger)[keyof typeof AutomationTrigger];

export const AUTOMATION_TRIGGERS = Object.values(AutomationTrigger);
