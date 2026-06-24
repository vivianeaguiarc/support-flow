import { z } from 'zod';

import { sanitizedString } from '../../../../shared/validation/zod-helpers.js';

export const createTicketCommentSchema = z
  .object({
    content: sanitizedString({
      min: 1,
      max: 5000,
      message: 'Comment content is required',
    }),
  })
  .strict();

export type CreateTicketCommentDto = z.infer<typeof createTicketCommentSchema>;
