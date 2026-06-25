import { z } from 'zod';

const ticketIdsSchema = z
  .array(z.uuid('Each ticketId must be a valid UUID'))
  .min(1, 'ticketIds must contain at least one ticket')
  .transform((ids) => [...new Set(ids)]);

const reasonSchema = z.string().trim().min(1).max(1000).optional();

export const bulkUpdateTicketStatusSchema = z.object({
  ticketIds: ticketIdsSchema,
  status: z.enum([
    'OPEN',
    'IN_PROGRESS',
    'WAITING_CUSTOMER',
    'ESCALATED',
    'RESOLVED',
    'CLOSED',
  ]),
  reason: reasonSchema,
});

export const bulkAssignTicketsSchema = z.object({
  ticketIds: ticketIdsSchema,
  assignedToId: z.uuid('Invalid agent ID'),
  reason: reasonSchema,
});

export type BulkUpdateTicketStatusDto = z.infer<
  typeof bulkUpdateTicketStatusSchema
>;

export type BulkAssignTicketsDto = z.infer<typeof bulkAssignTicketsSchema>;
