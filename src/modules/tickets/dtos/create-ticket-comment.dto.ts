import { z } from 'zod';

export const createTicketCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment content is required')
    .max(5000, 'Comment content must be at most 5000 characters'),
});

export type CreateTicketCommentDto = z.infer<typeof createTicketCommentSchema>;
