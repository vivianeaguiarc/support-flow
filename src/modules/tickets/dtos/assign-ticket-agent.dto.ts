import { z } from 'zod';

export const assignTicketAgentSchema = z.object({
  assignedAgentId: z.uuid('Invalid agent ID'),
});

export type AssignTicketAgentDto = z.infer<typeof assignTicketAgentSchema>;
