import { z } from 'zod';

export const updateTicketStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'RESOLVED',
    'CLOSED',
  ]),
});

export type UpdateTicketStatusDto = z.infer<typeof updateTicketStatusSchema>;
