import cors from 'cors';
import type { RequestHandler } from 'express';
import helmet from 'helmet';

import { env } from '../../../config/env.js';

const isProduction = env.NODE_ENV === 'production';

export const securityMiddleware: RequestHandler[] = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: isProduction
      ? {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-tenant-id',
      'x-tenant-slug',
      'x-request-id',
    ],
    exposedHeaders: [
      'RateLimit-Limit',
      'RateLimit-Remaining',
      'RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86_400,
    optionsSuccessStatus: 204,
  }),
];
