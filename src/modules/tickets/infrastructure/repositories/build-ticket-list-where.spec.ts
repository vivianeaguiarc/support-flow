import { describe, expect, it } from 'vitest';

import { TicketPriority, TicketStatus } from '../../domain/ticket-enums.js';
import { buildTicketListWhere } from './build-ticket-list-where.js';

describe('buildTicketListWhere', () => {
  it('should always scope by tenantId', () => {
    const where = buildTicketListWhere({ tenantId: 'tenant-1' });

    expect(where.tenantId).toBe('tenant-1');
  });

  it('should apply status, priority and category filters', () => {
    const where = buildTicketListWhere({
      tenantId: 'tenant-1',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      categoryId: 'category-1',
    });

    expect(where).toMatchObject({
      tenantId: 'tenant-1',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      categoryId: 'category-1',
    });
  });

  it('should filter unassigned tickets', () => {
    const where = buildTicketListWhere({
      tenantId: 'tenant-1',
      unassigned: true,
    });

    expect(where.assignedToId).toBeNull();
  });

  it('should filter overdue tickets excluding resolved and closed', () => {
    const before = Date.now();
    const where = buildTicketListWhere({
      tenantId: 'tenant-1',
      overdue: true,
    });
    const after = Date.now();

    expect(where.status).toEqual({
      notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
    });
    expect(where.slaDueAt).toMatchObject({
      lt: expect.any(Date),
    });

    const slaDueAt = (where.slaDueAt as { lt: Date }).lt;
    expect(slaDueAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(slaDueAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('should search protocol, title and description', () => {
    const where = buildTicketListWhere({
      tenantId: 'tenant-1',
      search: 'protocol-123',
    });

    expect(where.OR).toEqual([
      { protocol: { contains: 'protocol-123', mode: 'insensitive' } },
      { title: { contains: 'protocol-123', mode: 'insensitive' } },
      { description: { contains: 'protocol-123', mode: 'insensitive' } },
    ]);
  });

  it('should filter by creation date range', () => {
    const createdFrom = new Date('2026-06-01T00:00:00.000Z');
    const createdTo = new Date('2026-06-30T23:59:59.999Z');

    const where = buildTicketListWhere({
      tenantId: 'tenant-1',
      createdFrom,
      createdTo,
    });

    expect(where.createdAt).toEqual({
      gte: createdFrom,
      lte: createdTo,
    });
  });
});
