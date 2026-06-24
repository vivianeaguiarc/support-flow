import { z } from 'zod';

import {
  createdAtRangeQueryFields,
  paginationQueryFields,
  withCreatedAtRangeRefine,
} from '../../../../shared/http/dtos/pagination-query.dto.js';
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

const optionalBooleanQuery = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : undefined),
  z.boolean().optional(),
);

const listTicketsQueryBaseSchema = z
  .object({
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
    categoryId: z.uuid('Invalid category ID').optional(),
    customerId: z.uuid('Invalid customer ID').optional(),
    assignedToId: z.uuid('Invalid agent ID').optional(),
    unassigned: optionalBooleanQuery,
    team: z.enum(['AGENT', 'SUPERVISOR', 'ADMIN']).optional(),
    overdue: optionalBooleanQuery,
    search: paginationQueryFields.search,
    createdFrom: createdAtRangeQueryFields.createdFrom,
    createdTo: createdAtRangeQueryFields.createdTo,
    page: paginationQueryFields.page.default(DEFAULT_TICKET_LIST_PAGE),
    limit: paginationQueryFields.limit.default(DEFAULT_TICKET_LIST_LIMIT),
    sortBy: z
      .enum(TICKET_LIST_SORT_FIELDS)
      .default(DEFAULT_TICKET_LIST_SORT_BY),
    sortOrder: z
      .enum(TICKET_LIST_SORT_ORDERS)
      .default(DEFAULT_TICKET_LIST_SORT_ORDER),
  })
  .refine((data) => !(data.unassigned && data.assignedToId), {
    message: 'unassigned cannot be combined with assignedTo or assignedToId',
  });

export const listTicketsQuerySchema = withCreatedAtRangeRefine(
  z.preprocess((input) => {
    if (typeof input !== 'object' || input === null) {
      return input;
    }

    const query = input as Record<string, unknown>;

    if (query.assignedTo && !query.assignedToId) {
      return {
        ...query,
        assignedToId: query.assignedTo,
      };
    }

    return query;
  }, listTicketsQueryBaseSchema),
);

export type ListTicketsQueryDto = z.infer<typeof listTicketsQuerySchema>;
