import { env } from '../../../config/env.js';
import { createRateLimit } from './create-rate-limit.js';

export const rateLimitMiddleware = createRateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests, please try again later',
});
