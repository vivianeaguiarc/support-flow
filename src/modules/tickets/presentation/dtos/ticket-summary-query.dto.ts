import { z } from 'zod';

const optionalBooleanQuery = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : undefined),
  z.boolean().optional(),
);

export const ticketSummaryQuerySchema = z
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

export type TicketSummaryQueryDto = z.infer<typeof ticketSummaryQuerySchema>;
