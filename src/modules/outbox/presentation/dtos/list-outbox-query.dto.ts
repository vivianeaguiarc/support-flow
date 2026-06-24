import { z } from 'zod';

export const listOutboxQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED']).optional(),
  eventName: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type ListOutboxQueryDto = z.infer<typeof listOutboxQuerySchema>;
