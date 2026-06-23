import type { Prisma } from '@prisma/client';

import {
  DEFAULT_TICKET_LIST_SORT_BY,
  DEFAULT_TICKET_LIST_SORT_ORDER,
  type TicketListSortField,
  type TicketListSortOrder,
} from '../../domain/ticket-list-sort.js';

export function buildTicketListOrderBy(
  sortBy?: TicketListSortField,
  sortOrder?: TicketListSortOrder,
): Prisma.TicketOrderByWithRelationInput {
  const field = sortBy ?? DEFAULT_TICKET_LIST_SORT_BY;
  const order = sortOrder ?? DEFAULT_TICKET_LIST_SORT_ORDER;

  return { [field]: order };
}
