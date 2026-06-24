import { z } from 'zod';

import {
  SATISFACTION_MAX_RATING,
  SATISFACTION_MIN_RATING,
} from '../../domain/ticket-satisfaction-survey.entity.js';

export const submitTicketSatisfactionSchema = z.object({
  rating: z
    .number()
    .int()
    .min(SATISFACTION_MIN_RATING)
    .max(SATISFACTION_MAX_RATING),
  comment: z.string().trim().max(1000).optional(),
});

export type SubmitTicketSatisfactionDto = z.infer<
  typeof submitTicketSatisfactionSchema
>;
