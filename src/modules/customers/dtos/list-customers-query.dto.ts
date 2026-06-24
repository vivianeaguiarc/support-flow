import { z } from 'zod';

import {
  createdAtRangeQueryFields,
  paginationQueryFields,
  withCreatedAtRangeRefine,
} from '../../../shared/http/dtos/pagination-query.dto.js';

export const CUSTOMER_LIST_SORT_FIELDS = [
  'name',
  'email',
  'createdAt',
] as const;

export type CustomerListSortField = (typeof CUSTOMER_LIST_SORT_FIELDS)[number];

const optionalBooleanQuery = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : undefined),
  z.boolean().optional(),
);

export const listCustomersQuerySchema = withCreatedAtRangeRefine(
  z.object({
    page: paginationQueryFields.page,
    limit: paginationQueryFields.limit,
    sortOrder: paginationQueryFields.sortOrder,
    search: paginationQueryFields.search,
    createdFrom: createdAtRangeQueryFields.createdFrom,
    createdTo: createdAtRangeQueryFields.createdTo,
    sortBy: z.enum(CUSTOMER_LIST_SORT_FIELDS).default('createdAt'),
    isActive: optionalBooleanQuery,
  }),
);

export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;
