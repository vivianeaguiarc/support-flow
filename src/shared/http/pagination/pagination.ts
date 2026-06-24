export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function resolvePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number } {
  const parsedPage = Number(page ?? DEFAULT_PAGE);
  const parsedLimit = Number(limit ?? DEFAULT_LIMIT);

  return {
    page:
      Number.isFinite(parsedPage) && parsedPage >= 1
        ? Math.floor(parsedPage)
        : DEFAULT_PAGE,
    limit: Math.min(
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.floor(parsedLimit)
        : DEFAULT_LIMIT,
      MAX_LIMIT,
    ),
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

export function toPaginatedResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}
