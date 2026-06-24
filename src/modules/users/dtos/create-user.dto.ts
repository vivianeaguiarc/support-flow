import { z } from 'zod';

import { sanitizedString } from '../../../shared/validation/zod-helpers.js';

export const createUserSchema = z
  .object({
    name: sanitizedString({ min: 2, max: 120, message: 'Name is required' }),
    email: z.email('Invalid email format').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'SUPERVISOR', 'AGENT', 'CUSTOMER', 'OMBUDSMAN']),
  })
  .strict();

export type CreateUserDto = z.infer<typeof createUserSchema>;
