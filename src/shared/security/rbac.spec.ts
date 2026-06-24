import { describe, expect, it } from 'vitest';

import { AppError } from '../errors/app-error.js';
import { TicketStatus } from '../types/ticket-status.js';
import { UserRole } from '../types/user-role.js';
import {
  assertCanAssignTicket,
  assertCanCreateTicket,
  assertCanManageTicket,
  assertTicketAccess,
  canAccessInternalComments,
  canBeAssignedTickets,
  canManageTickets,
  hasAnyRole,
  isAdmin,
  ROLE_GROUPS,
} from './rbac.js';

describe('rbac', () => {
  const agent = {
    id: 'agent-1',
    email: 'agent@test.com',
    role: UserRole.AGENT,
    tenantId: 'tenant-1',
  };

  const customer = {
    id: 'customer-1',
    email: 'customer@test.com',
    role: UserRole.CUSTOMER,
    tenantId: 'tenant-1',
  };

  const ombudsman = {
    id: 'ombudsman-1',
    email: 'ombudsman@test.com',
    role: UserRole.OMBUDSMAN,
    tenantId: 'tenant-1',
  };

  it('should identify admin role', () => {
    expect(isAdmin(UserRole.ADMIN)).toBe(true);
    expect(isAdmin(UserRole.AGENT)).toBe(false);
  });

  it('should validate role groups', () => {
    expect(hasAnyRole(UserRole.SUPERVISOR, [...ROLE_GROUPS.METRICS])).toBe(
      true,
    );
    expect(hasAnyRole(UserRole.CUSTOMER, [...ROLE_GROUPS.METRICS])).toBe(false);
  });

  it('should block customers from internal comments', () => {
    expect(canAccessInternalComments(UserRole.CUSTOMER)).toBe(false);
    expect(canAccessInternalComments(UserRole.AGENT)).toBe(true);
    expect(canAccessInternalComments(UserRole.ADMIN)).toBe(true);
    expect(canAccessInternalComments(UserRole.SUPERVISOR)).toBe(true);
    expect(canAccessInternalComments(UserRole.OMBUDSMAN)).toBe(false);
  });

  it('should allow ombudsman to manage only escalated tickets', () => {
    expect(canManageTickets(UserRole.OMBUDSMAN, TicketStatus.ESCALATED)).toBe(
      true,
    );
    expect(canManageTickets(UserRole.OMBUDSMAN, TicketStatus.OPEN)).toBe(false);
  });

  it('should allow assignable staff roles', () => {
    expect(canBeAssignedTickets(UserRole.SUPERVISOR)).toBe(true);
    expect(canBeAssignedTickets(UserRole.CUSTOMER)).toBe(false);
  });

  it('should allow customers only on their own tickets', () => {
    expect(() =>
      assertTicketAccess(
        { customerId: 'customer-1', status: TicketStatus.OPEN },
        customer,
      ),
    ).not.toThrow();

    expect(() =>
      assertTicketAccess(
        { customerId: 'other-customer', status: TicketStatus.OPEN },
        customer,
      ),
    ).toThrow(new AppError('Forbidden', 403));
  });

  it('should allow ombudsman only on escalated tickets', () => {
    expect(() =>
      assertTicketAccess(
        { customerId: 'customer-1', status: TicketStatus.ESCALATED },
        ombudsman,
      ),
    ).not.toThrow();

    expect(() =>
      assertTicketAccess(
        { customerId: 'customer-1', status: TicketStatus.OPEN },
        ombudsman,
      ),
    ).toThrow(new AppError('Forbidden', 403));
  });

  it('should block customers from creating tickets for others', () => {
    expect(() =>
      assertCanCreateTicket(customer, {
        customerId: 'other-customer',
      }),
    ).toThrow(new AppError('Forbidden', 403));
  });

  it('should block customers from assigning agents on create', () => {
    expect(() =>
      assertCanCreateTicket(customer, {
        customerId: customer.id,
        assignedToId: 'agent-1',
      }),
    ).toThrow(new AppError('Customers cannot assign agents', 400));
  });

  it('should allow agents to manage tickets', () => {
    expect(() => assertCanManageTicket(agent)).not.toThrow();
  });

  it('should allow only supervisor and admin to assign tickets', () => {
    expect(() =>
      assertCanAssignTicket({
        ...agent,
        role: UserRole.SUPERVISOR,
      }),
    ).not.toThrow();
    expect(() => assertCanAssignTicket(agent)).toThrow(
      new AppError('Forbidden', 403),
    );
  });
});
