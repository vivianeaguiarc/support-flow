import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  expiresAt: z.coerce.date().optional(),
});

export const apiKeyIdParamSchema = z.object({
  id: z.uuid('Invalid API key ID'),
});

export type CreateApiKeyDto = z.infer<typeof createApiKeySchema>;
