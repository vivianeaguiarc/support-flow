import { describe, expect, it } from 'vitest';

import type { Ticket } from '../../tickets/domain/ticket.entity.js';
import {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';
import { AutomationConditionType } from './automation-condition.js';
import { evaluateAutomationConditions } from './condition-evaluator.js';

const baseTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-20260624-ABC123',
  title: 'Test ticket',
  description: 'Description',
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  customerId: 'customer-1',
  categoryId: 'category-1',
  assignedToId: null,
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date('2026-06-24T10:00:00.000Z'),
  updatedAt: new Date('2026-06-24T10:00:00.000Z'),
  ...overrides,
});

describe('evaluateAutomationConditions', () => {
  it('should return true when no conditions are defined', () => {
    expect(evaluateAutomationConditions([], baseTicket())).toBe(true);
  });

  it('should match priority_equals condition', () => {
    const ticket = baseTicket({ priority: TicketPriority.HIGH });

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: TicketPriority.HIGH,
          },
        ],
        ticket,
      ),
    ).toBe(true);

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: TicketPriority.LOW,
          },
        ],
        ticket,
      ),
    ).toBe(false);
  });

  it('should match status_equals condition', () => {
    const ticket = baseTicket({ status: TicketStatus.IN_PROGRESS });

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.STATUS_EQUALS,
            value: TicketStatus.IN_PROGRESS,
          },
        ],
        ticket,
      ),
    ).toBe(true);
  });

  it('should match category_equals condition', () => {
    const ticket = baseTicket({ categoryId: 'category-abc' });

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.CATEGORY_EQUALS,
            value: 'category-abc',
          },
        ],
        ticket,
      ),
    ).toBe(true);
  });

  it('should match assigned_to_exists condition', () => {
    const assigned = baseTicket({ assignedToId: 'agent-1' });
    const unassigned = baseTicket({ assignedToId: null });

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.ASSIGNED_TO_EXISTS,
            value: true,
          },
        ],
        assigned,
      ),
    ).toBe(true);

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.ASSIGNED_TO_EXISTS,
            value: false,
          },
        ],
        unassigned,
      ),
    ).toBe(true);
  });

  it('should match ticket_age_greater_than condition', () => {
    const ticket = baseTicket({
      createdAt: new Date('2026-06-24T08:00:00.000Z'),
    });
    const now = new Date('2026-06-24T12:00:00.000Z');

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.TICKET_AGE_GREATER_THAN,
            value: { hours: 2 },
          },
        ],
        ticket,
        now,
      ),
    ).toBe(true);

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.TICKET_AGE_GREATER_THAN,
            value: { hours: 5 },
          },
        ],
        ticket,
        now,
      ),
    ).toBe(false);
  });

  it('should require all conditions to match', () => {
    const ticket = baseTicket({
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
    });

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: TicketPriority.HIGH,
          },
          {
            type: AutomationConditionType.STATUS_EQUALS,
            value: TicketStatus.OPEN,
          },
        ],
        ticket,
      ),
    ).toBe(true);

    expect(
      evaluateAutomationConditions(
        [
          {
            type: AutomationConditionType.PRIORITY_EQUALS,
            value: TicketPriority.HIGH,
          },
          {
            type: AutomationConditionType.STATUS_EQUALS,
            value: TicketStatus.CLOSED,
          },
        ],
        ticket,
      ),
    ).toBe(false);
  });
});
