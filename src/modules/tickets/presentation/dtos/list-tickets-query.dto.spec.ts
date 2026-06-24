import { describe, expect, it } from 'vitest';

import { listTicketsQuerySchema } from './list-tickets-query.dto.js';

describe('listTicketsQuerySchema', () => {
  it('should map assignedTo alias to assignedToId', () => {
    const agentId = '550e8400-e29b-41d4-a716-446655440001';

    const parsed = listTicketsQuerySchema.parse({
      assignedTo: agentId,
    });

    expect(parsed.assignedToId).toBe(agentId);
  });

  it('should reject limit above the maximum allowed value', () => {
    expect(() =>
      listTicketsQuerySchema.parse({
        limit: 101,
      }),
    ).toThrow();
  });
});
