import type { Prisma } from '@prisma/client';

import type { TicketCategoryListSortField } from '../../presentation/dtos/list-ticket-categories-query.dto.js';

export function buildTicketCategoryListOrderBy(
  sortBy: TicketCategoryListSortField = 'name',
  sortOrder: 'asc' | 'desc' = 'desc',
): Prisma.TicketCategoryOrderByWithRelationInput {
  return { [sortBy]: sortOrder };
}
