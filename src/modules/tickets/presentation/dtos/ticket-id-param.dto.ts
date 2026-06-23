import { z } from 'zod';

export const ticketIdParamSchema = z.object({
  id: z.uuid('Invalid ticket ID'),
});

export type TicketIdParamDto = z.infer<typeof ticketIdParamSchema>;
