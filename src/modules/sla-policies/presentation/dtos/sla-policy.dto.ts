import { z } from 'zod';

import { TICKET_PRIORITIES } from '../../../tickets/domain/ticket-enums.js';

const priorityValues = TICKET_PRIORITIES as [string, ...string[]];

const MAX_HOURS = 24 * 365; // 1 year upper bound to prevent absurd values.

const hoursSchema = z
  .number()
  .int('Must be an integer number of hours')
  .min(1, 'Must be at least 1 hour')
  .max(MAX_HOURS, 'Exceeds the maximum allowed hours');

const baseSlaPolicyFields = {
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullish(),
  priority: z.enum(priorityValues).nullish(),
  categoryIds: z.array(z.uuid('Invalid category ID')).max(100).optional(),
  firstResponseHours: hoursSchema,
  resolutionHours: hoursSchema,
  businessHoursOnly: z.boolean().optional(),
  isActive: z.boolean().optional(),
};

function ensureResolutionAfterResponse(
  value: {
    firstResponseHours?: number;
    resolutionHours?: number;
  },
  ctx: z.RefinementCtx,
): void {
  if (
    value.firstResponseHours !== undefined &&
    value.resolutionHours !== undefined &&
    value.resolutionHours < value.firstResponseHours
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['resolutionHours'],
      message:
        'resolutionHours must be greater than or equal to firstResponseHours',
    });
  }
}

export const createSlaPolicySchema = z
  .object(baseSlaPolicyFields)
  .superRefine(ensureResolutionAfterResponse);

export const updateSlaPolicySchema = z
  .object(baseSlaPolicyFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  })
  .superRefine(ensureResolutionAfterResponse);

export const slaPolicyIdParamSchema = z.object({
  id: z.uuid('Invalid SLA policy ID'),
});

const optionalBooleanQuery = z.preprocess(
  (value) => (value === 'true' ? true : value === 'false' ? false : undefined),
  z.boolean().optional(),
);

export const listSlaPoliciesQuerySchema = z.object({
  isActive: optionalBooleanQuery,
  priority: z.enum(priorityValues).optional(),
});

export type CreateSlaPolicyDto = z.infer<typeof createSlaPolicySchema>;
export type UpdateSlaPolicyDto = z.infer<typeof updateSlaPolicySchema>;
export type ListSlaPoliciesQueryDto = z.infer<
  typeof listSlaPoliciesQuerySchema
>;
