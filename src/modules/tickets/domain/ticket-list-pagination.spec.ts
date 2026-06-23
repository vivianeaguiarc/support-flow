import { describe, expect, it } from 'vitest';

import { resolveTicketListPagination } from './ticket-list-pagination.js';

describe('resolveTicketListPagination', () => {
  it('should apply default page and limit', () => {
    expect(resolveTicketListPagination()).toEqual({
      page: 1,
      limit: 10,
    });
  });

  it('should coerce string pagination values', () => {
    expect(
      resolveTicketListPagination(
        '2' as unknown as number,
        '25' as unknown as number,
      ),
    ).toEqual({
      page: 2,
      limit: 25,
    });
  });

  it('should cap limit at the maximum allowed value', () => {
    expect(resolveTicketListPagination(2, 500)).toEqual({
      page: 2,
      limit: 100,
    });
  });
});
