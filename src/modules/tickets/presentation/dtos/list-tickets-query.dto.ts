import { z } from 'zod';

import {
  DEFAULT_TICKET_LIST_LIMIT,
  DEFAULT_TICKET_LIST_PAGE,
  MAX_TICKET_LIST_LIMIT,
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

export const listTicketsQuerySchema = z
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
    overdue: optionalBooleanQuery,
    search: z.string().trim().min(1, 'Search term is required').optional(),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(DEFAULT_TICKET_LIST_PAGE),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_TICKET_LIST_LIMIT)
      .default(DEFAULT_TICKET_LIST_LIMIT),
    sortBy: z
      .enum(TICKET_LIST_SORT_FIELDS)
      .default(DEFAULT_TICKET_LIST_SORT_BY),
    sortOrder: z
      .enum(TICKET_LIST_SORT_ORDERS)
      .default(DEFAULT_TICKET_LIST_SORT_ORDER),
  })
  .refine((data) => !(data.unassigned && data.assignedToId), {
    message: 'unassigned cannot be combined with assignedToId',
  })
  .refine(
    (data) =>
      !data.createdFrom ||
      !data.createdTo ||
      data.createdFrom.getTime() <= data.createdTo.getTime(),
    {
      message: 'createdFrom must be before or equal to createdTo',
    },
  );

export type ListTicketsQueryDto = z.infer<typeof listTicketsQuerySchema>;
