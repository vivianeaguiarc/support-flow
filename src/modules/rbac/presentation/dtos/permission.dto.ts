import { z } from 'zod';

export const createPermissionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[a-z][a-zA-Z0-9.]*$/, 'Invalid permission key format'),
    description: z.string().trim().max(255).optional(),
  })
  .strict();

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
