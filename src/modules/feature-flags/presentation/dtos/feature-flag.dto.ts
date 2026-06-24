import { z } from 'zod';

const featureFlagKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z][a-z0-9._-]*$/,
    'Key must start with a lowercase letter and contain only lowercase letters, numbers, dots, underscores or hyphens',
  );

export const createFeatureFlagSchema = z.object({
  key: featureFlagKeySchema,
  description: z.string().trim().max(500).optional(),
  enabled: z.boolean().default(false),
});

export const updateFeatureFlagSchema = z
  .object({
    description: z.string().trim().max(500).nullable().optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (value) => value.description !== undefined || value.enabled !== undefined,
    { message: 'At least one field must be provided' },
  );

export const featureFlagKeyParamSchema = z.object({
  key: featureFlagKeySchema,
});

export type CreateFeatureFlagDto = z.infer<typeof createFeatureFlagSchema>;
export type UpdateFeatureFlagDto = z.infer<typeof updateFeatureFlagSchema>;
