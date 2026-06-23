import { z } from 'zod';

export const ticketMetricsQuerySchema = z.object({
  categoryId: z.uuid('Invalid category ID').optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export type TicketMetricsQueryDto = z.infer<typeof ticketMetricsQuerySchema>;
