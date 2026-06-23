import { z } from 'zod';

export const assignTicketSchema = z.object({
  assignedToId: z.uuid('Invalid agent ID'),
});

export type AssignTicketDto = z.infer<typeof assignTicketSchema>;
