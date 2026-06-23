import { describe, expect, it } from 'vitest';

import { buildTicketListOrderBy } from './build-ticket-list-order-by.js';

describe('buildTicketListOrderBy', () => {
  it('should default to createdAt desc', () => {
    expect(buildTicketListOrderBy()).toEqual({ createdAt: 'desc' });
  });

  it('should build order by slaDueAt asc', () => {
    expect(buildTicketListOrderBy('slaDueAt', 'asc')).toEqual({
      slaDueAt: 'asc',
    });
  });

  it('should build order by priority desc', () => {
    expect(buildTicketListOrderBy('priority', 'desc')).toEqual({
      priority: 'desc',
    });
  });
});
