import { z } from 'zod';

import { sanitizedString } from '../../../../shared/validation/zod-helpers.js';

export const createTicketSchema = z
  .object({
    title: sanitizedString({ min: 3, max: 200, message: 'Title is required' }),
    description: sanitizedString({
      min: 10,
      max: 10_000,
      message: 'Description is required',
    }),
    customerId: z.uuid('Invalid customer ID'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    categoryId: z.uuid('Invalid category ID').optional(),
    assignedToId: z.uuid('Invalid agent ID').optional(),
  })
  .strict();

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
