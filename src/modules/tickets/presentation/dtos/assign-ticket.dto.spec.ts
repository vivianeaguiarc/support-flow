import { describe, expect, it } from 'vitest';

import { assignTicketSchema } from './assign-ticket.dto.js';

describe('assignTicketSchema', () => {
  const agentId = '550e8400-e29b-41d4-a716-446655440001';

  it('should accept agentId payload', () => {
    const result = assignTicketSchema.parse({ agentId });

    expect(result).toEqual({ agentId });
  });

  it('should accept assignedToId as legacy alias', () => {
    const result = assignTicketSchema.parse({ assignedToId: agentId });

    expect(result).toEqual({ agentId });
  });

  it('should prefer agentId when both fields are provided', () => {
    const preferredId = '660e8400-e29b-41d4-a716-446655440002';
    const result = assignTicketSchema.parse({
      agentId: preferredId,
      assignedToId: agentId,
    });

    expect(result).toEqual({ agentId: preferredId });
  });

  it('should reject payload without agent identifier', () => {
    expect(() => assignTicketSchema.parse({})).toThrow();
  });
});
