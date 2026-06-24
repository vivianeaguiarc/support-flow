import { z } from 'zod';

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from '../pagination/pagination.js';

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const paginationQueryFields = {
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT, `limit must be at most ${MAX_LIMIT}`)
    .default(DEFAULT_LIMIT),
  sortOrder: sortOrderSchema.default('desc'),
  search: z.string().trim().min(1, 'Search term is required').optional(),
};

export const createdAtRangeQueryFields = {
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
};

export function withCreatedAtRangeRefine<
  T extends {
    createdFrom?: Date;
    createdTo?: Date;
  },
>(schema: z.ZodType<T>): z.ZodType<T> {
  return schema.refine(
    (data) =>
      !data.createdFrom ||
      !data.createdTo ||
      data.createdFrom.getTime() <= data.createdTo.getTime(),
    {
      message: 'createdFrom must be before or equal to createdTo',
    },
  );
}
