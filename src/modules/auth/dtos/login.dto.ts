import { z } from 'zod';

export const loginSchema = z
  .object({
    email: z.email('Invalid email format').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .strict();

export type LoginDto = z.infer<typeof loginSchema>;
