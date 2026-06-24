import type { Ticket } from '../../tickets/domain/ticket.entity.js';
import {
  type AutomationCondition,
  AutomationConditionType,
} from './automation-condition.js';

export function evaluateAutomationConditions(
  conditions: AutomationCondition[],
  ticket: Ticket,
  now: Date = new Date(),
): boolean {
  if (conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) =>
    evaluateAutomationCondition(condition, ticket, now),
  );
}

function evaluateAutomationCondition(
  condition: AutomationCondition,
  ticket: Ticket,
  now: Date,
): boolean {
  switch (condition.type) {
    case AutomationConditionType.PRIORITY_EQUALS:
      return ticket.priority === condition.value;
    case AutomationConditionType.STATUS_EQUALS:
      return ticket.status === condition.value;
    case AutomationConditionType.CATEGORY_EQUALS:
      return ticket.categoryId === condition.value;
    case AutomationConditionType.ASSIGNED_TO_EXISTS:
      return condition.value
        ? ticket.assignedToId !== null
        : ticket.assignedToId === null;
    case AutomationConditionType.TICKET_AGE_GREATER_THAN: {
      const ageHours =
        (now.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      return ageHours > condition.value.hours;
    }
    default:
      return false;
  }
}
