import { z } from 'zod';

export const ticketInternalCommentsParamsSchema = z.object({
  ticketId: z.uuid('Invalid ticket ID'),
});

export type TicketInternalCommentsParamsDto = z.infer<
  typeof ticketInternalCommentsParamsSchema
>;
