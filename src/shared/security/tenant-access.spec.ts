import { describe, expect, it } from 'vitest';

import { AppError } from '../errors/app-error.js';
import { assertTicketForTenant } from './tenant-access.js';

describe('assertTicketForTenant', () => {
  const ticket = {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    protocol: 'P-1',
    title: 'Test',
    description: 'Test',
    status: 'OPEN',
    priority: 'MEDIUM',
    categoryId: null,
    customerId: 'customer-1',
    assignedToId: null,
    slaDueAt: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should return ticket when tenant matches', () => {
    expect(assertTicketForTenant(ticket, 'tenant-1')).toEqual(ticket);
  });

  it('should throw 404 when ticket does not exist', () => {
    expect(() => assertTicketForTenant(null, 'tenant-1')).toThrow(
      new AppError('Ticket not found', 404),
    );
  });

  it('should throw 403 for cross-tenant access', () => {
    expect(() => assertTicketForTenant(ticket, 'tenant-2')).toThrow(
      new AppError('Forbidden', 403),
    );
  });
});
