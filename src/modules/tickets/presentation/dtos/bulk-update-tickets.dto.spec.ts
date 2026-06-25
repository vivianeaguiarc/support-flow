import { describe, expect, it } from 'vitest';

import {
  bulkAssignTicketsSchema,
  bulkUpdateTicketStatusSchema,
} from './bulk-update-tickets.dto.js';

const idA = '550e8400-e29b-41d4-a716-446655440000';
const idB = '660e8400-e29b-41d4-a716-446655440001';

describe('bulkUpdateTicketStatusSchema', () => {
  it('accepts a valid payload and removes duplicate ids', () => {
    const result = bulkUpdateTicketStatusSchema.parse({
      ticketIds: [idA, idB, idA],
      status: 'RESOLVED',
      reason: 'lote',
    });

    expect(result.ticketIds).toEqual([idA, idB]);
    expect(result.status).toBe('RESOLVED');
    expect(result.reason).toBe('lote');
  });

  it('rejects an empty ticketIds array', () => {
    expect(() =>
      bulkUpdateTicketStatusSchema.parse({ ticketIds: [], status: 'RESOLVED' }),
    ).toThrow();
  });

  it('rejects invalid ticket UUIDs', () => {
    expect(() =>
      bulkUpdateTicketStatusSchema.parse({
        ticketIds: ['not-a-uuid'],
        status: 'RESOLVED',
      }),
    ).toThrow();
  });

  it('rejects an invalid status', () => {
    expect(() =>
      bulkUpdateTicketStatusSchema.parse({
        ticketIds: [idA],
        status: 'INVALID',
      }),
    ).toThrow();
  });
});

describe('bulkAssignTicketsSchema', () => {
  it('accepts a valid payload and removes duplicate ids', () => {
    const result = bulkAssignTicketsSchema.parse({
      ticketIds: [idA, idA, idB],
      assignedToId: idA,
    });

    expect(result.ticketIds).toEqual([idA, idB]);
    expect(result.assignedToId).toBe(idA);
  });

  it('rejects an empty ticketIds array', () => {
    expect(() =>
      bulkAssignTicketsSchema.parse({ ticketIds: [], assignedToId: idA }),
    ).toThrow();
  });

  it('rejects an invalid assignedToId', () => {
    expect(() =>
      bulkAssignTicketsSchema.parse({
        ticketIds: [idA],
        assignedToId: 'not-a-uuid',
      }),
    ).toThrow();
  });
});
