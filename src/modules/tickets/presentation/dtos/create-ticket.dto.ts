import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  customerId: z.uuid('Invalid customer ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  categoryId: z.uuid('Invalid category ID').optional(),
  assignedToId: z.uuid('Invalid agent ID').optional(),
});

export type CreateTicketDto = z.infer<typeof createTicketSchema>;
