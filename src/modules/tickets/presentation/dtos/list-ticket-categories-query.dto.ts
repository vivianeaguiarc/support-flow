import { z } from 'zod';

import {
  createdAtRangeQueryFields,
  paginationQueryFields,
  withCreatedAtRangeRefine,
} from '../../../../shared/http/dtos/pagination-query.dto.js';

export const TICKET_CATEGORY_LIST_SORT_FIELDS = ['name', 'createdAt'] as const;

export type TicketCategoryListSortField =
  (typeof TICKET_CATEGORY_LIST_SORT_FIELDS)[number];

const optionalBooleanQuery = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : undefined),
  z.boolean().optional(),
);

export const listTicketCategoriesQuerySchema = withCreatedAtRangeRefine(
  z.object({
    page: paginationQueryFields.page,
    limit: paginationQueryFields.limit,
    sortOrder: paginationQueryFields.sortOrder,
    search: paginationQueryFields.search,
    createdFrom: createdAtRangeQueryFields.createdFrom,
    createdTo: createdAtRangeQueryFields.createdTo,
    sortBy: z.enum(TICKET_CATEGORY_LIST_SORT_FIELDS).default('name'),
    isActive: optionalBooleanQuery,
  }),
);

export type ListTicketCategoriesQueryDto = z.infer<
  typeof listTicketCategoriesQuerySchema
>;
