import { describe, expect, it } from 'vitest';

import { ForbiddenError } from '../../../shared/errors/http-errors.js';
import { UserRole } from '../../../shared/types/user-role.js';
import type { Ticket } from './ticket.entity.js';
import { TicketPriority, TicketStatus } from './ticket-enums.js';
import {
  assertCanSubmitTicketSatisfaction,
  assertTicketHasNoSatisfactionSurvey,
  isSatisfactionEligibleStatus,
} from './ticket-satisfaction.rules.js';

const baseTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-20260624-ABC123',
  title: 'Test ticket',
  description: 'Description',
  status: TicketStatus.RESOLVED,
  priority: TicketPriority.MEDIUM,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: 'agent-1',
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date('2026-06-24T10:00:00.000Z'),
  updatedAt: new Date('2026-06-24T10:00:00.000Z'),
  ...overrides,
});

const customerUser = {
  id: 'customer-1',
  email: 'customer@test.com',
  role: UserRole.CUSTOMER,
  tenantId: 'tenant-1',
};

describe('ticket-satisfaction.rules', () => {
  it('should allow customer to submit for own resolved ticket', () => {
    expect(() =>
      assertCanSubmitTicketSatisfaction(customerUser, baseTicket()),
    ).not.toThrow();
  });

  it('should reject non-customer roles', () => {
    expect(() =>
      assertCanSubmitTicketSatisfaction(
        { ...customerUser, role: UserRole.AGENT },
        baseTicket(),
      ),
    ).toThrow(ForbiddenError);
  });

  it('should reject customer evaluating another customer ticket', () => {
    expect(() =>
      assertCanSubmitTicketSatisfaction(
        customerUser,
        baseTicket({ customerId: 'other-customer' }),
      ),
    ).toThrow(ForbiddenError);
  });

  it('should reject open tickets', () => {
    expect(() =>
      assertCanSubmitTicketSatisfaction(
        customerUser,
        baseTicket({ status: TicketStatus.OPEN }),
      ),
    ).toThrow(
      'Satisfaction survey is only available for resolved or closed tickets',
    );
  });

  it('should detect duplicate survey', () => {
    expect(() =>
      assertTicketHasNoSatisfactionSurvey({ id: 'survey-1' }),
    ).toThrow('This ticket already has a satisfaction survey');
  });

  it('should identify eligible statuses', () => {
    expect(isSatisfactionEligibleStatus(TicketStatus.RESOLVED)).toBe(true);
    expect(isSatisfactionEligibleStatus(TicketStatus.CLOSED)).toBe(true);
    expect(isSatisfactionEligibleStatus(TicketStatus.OPEN)).toBe(false);
  });
});
