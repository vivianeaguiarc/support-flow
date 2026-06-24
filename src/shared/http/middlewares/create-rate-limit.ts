import rateLimit from 'express-rate-limit';

export type CreateRateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

export function createRateLimit(options: CreateRateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: options.message,
      });
    },
  });
}
