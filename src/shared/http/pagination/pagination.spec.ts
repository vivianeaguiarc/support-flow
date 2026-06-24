import { describe, expect, it } from 'vitest';

import {
  buildPaginationMeta,
  resolvePagination,
  toPaginatedResult,
} from './pagination.js';

describe('pagination', () => {
  it('should apply default page and limit', () => {
    expect(resolvePagination()).toEqual({ page: 1, limit: 10 });
  });

  it('should cap limit at the maximum allowed value', () => {
    expect(resolvePagination(1, 500)).toEqual({ page: 1, limit: 100 });
  });

  it('should build pagination metadata with next and previous flags', () => {
    expect(buildPaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it('should build paginated result envelope data', () => {
    const result = toPaginatedResult(['a', 'b'], 1, 10, 2);

    expect(result.data).toEqual(['a', 'b']);
    expect(result.meta.total).toBe(2);
    expect(result.meta.hasNextPage).toBe(false);
  });
});
