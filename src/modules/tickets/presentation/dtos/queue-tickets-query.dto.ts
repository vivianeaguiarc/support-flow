import { z } from 'zod';

import { paginationQueryFields } from '../../../../shared/http/dtos/pagination-query.dto.js';
import {
  DEFAULT_TICKET_LIST_LIMIT,
  DEFAULT_TICKET_LIST_PAGE,
} from '../../domain/ticket-list-pagination.js';
import {
  DEFAULT_TICKET_LIST_SORT_BY,
  DEFAULT_TICKET_LIST_SORT_ORDER,
  TICKET_LIST_SORT_FIELDS,
  TICKET_LIST_SORT_ORDERS,
} from '../../domain/ticket-list-sort.js';

export const queueTicketsQuerySchema = z.object({
  status: z
    .enum([
      'OPEN',
      'IN_PROGRESS',
      'WAITING_CUSTOMER',
      'ESCALATED',
      'RESOLVED',
      'CLOSED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: paginationQueryFields.page.default(DEFAULT_TICKET_LIST_PAGE),
  limit: paginationQueryFields.limit.default(DEFAULT_TICKET_LIST_LIMIT),
  sortBy: z.enum(TICKET_LIST_SORT_FIELDS).default(DEFAULT_TICKET_LIST_SORT_BY),
  sortOrder: z
    .enum(TICKET_LIST_SORT_ORDERS)
    .default(DEFAULT_TICKET_LIST_SORT_ORDER),
});

export type QueueTicketsQueryDto = z.infer<typeof queueTicketsQuerySchema>;
