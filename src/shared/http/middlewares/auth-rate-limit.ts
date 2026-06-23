import rateLimit from 'express-rate-limit';

import { env } from '../../../config/env.js';

export const authRateLimitMiddleware = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      statusCode: 429,
      message: 'Too many login attempts, please try again later',
    });
  },
});
