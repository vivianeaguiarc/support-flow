export const DEFAULT_TICKET_LIST_PAGE = 1;
export const DEFAULT_TICKET_LIST_LIMIT = 10;
export const MAX_TICKET_LIST_LIMIT = 100;

export function resolveTicketListPagination(
  page?: number,
  limit?: number,
): { page: number; limit: number } {
  const parsedPage = Number(page ?? DEFAULT_TICKET_LIST_PAGE);
  const parsedLimit = Number(limit ?? DEFAULT_TICKET_LIST_LIMIT);

  return {
    page:
      Number.isFinite(parsedPage) && parsedPage >= 1
        ? Math.floor(parsedPage)
        : DEFAULT_TICKET_LIST_PAGE,
    limit: Math.min(
      Number.isFinite(parsedLimit) && parsedLimit >= 1
        ? Math.floor(parsedLimit)
        : DEFAULT_TICKET_LIST_LIMIT,
      MAX_TICKET_LIST_LIMIT,
    ),
  };
}
