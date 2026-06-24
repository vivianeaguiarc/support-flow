import { z } from 'zod';

const assignTicketBodySchema = z
  .object({
    agentId: z.uuid('Invalid agent ID').optional(),
    assignedToId: z.uuid('Invalid agent ID').optional(),
  })
  .refine((data) => Boolean(data.agentId ?? data.assignedToId), {
    message: 'agentId is required',
    path: ['agentId'],
  })
  .transform((data) => ({
    agentId: (data.agentId ?? data.assignedToId)!,
  }));

export const assignTicketSchema = assignTicketBodySchema;

export type AssignTicketDto = z.infer<typeof assignTicketBodySchema>;
