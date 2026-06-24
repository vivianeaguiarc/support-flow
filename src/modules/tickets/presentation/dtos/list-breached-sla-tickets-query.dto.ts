import { z } from 'zod';

import { paginationQueryFields } from '../../../../shared/http/dtos/pagination-query.dto.js';

export const listBreachedSlaTicketsQuerySchema = z.object({
  page: paginationQueryFields.page,
  limit: paginationQueryFields.limit,
});

export type ListBreachedSlaTicketsQueryDto = z.infer<
  typeof listBreachedSlaTicketsQuerySchema
>;
