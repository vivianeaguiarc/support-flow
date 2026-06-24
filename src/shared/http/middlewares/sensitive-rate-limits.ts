import type { RequestHandler } from 'express';

import { env } from '../../../config/env.js';
import { createRateLimit } from './create-rate-limit.js';

function whenEnabled(middleware: RequestHandler): RequestHandler[] {
  return env.RATE_LIMIT_ENABLED ? [middleware] : [];
}

export const authRateLimitMiddleware = createRateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many login attempts, please try again later',
});

export const ticketCreateRateLimitMiddleware = createRateLimit({
  windowMs: env.TICKET_CREATE_RATE_LIMIT_WINDOW_MS,
  max: env.TICKET_CREATE_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many ticket creation requests, please try again later',
});

export const attachmentUploadRateLimitMiddleware = createRateLimit({
  windowMs: env.ATTACHMENT_UPLOAD_RATE_LIMIT_WINDOW_MS,
  max: env.ATTACHMENT_UPLOAD_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many attachment uploads, please try again later',
});

export const apiKeyRateLimitMiddleware = createRateLimit({
  windowMs: env.API_KEY_RATE_LIMIT_WINDOW_MS,
  max: env.API_KEY_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many API key operations, please try again later',
});

export const webhookRateLimitMiddleware = createRateLimit({
  windowMs: env.WEBHOOK_RATE_LIMIT_WINDOW_MS,
  max: env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many webhook operations, please try again later',
});

export const ticketCreateRateLimit = whenEnabled(
  ticketCreateRateLimitMiddleware,
);
export const attachmentUploadRateLimit = whenEnabled(
  attachmentUploadRateLimitMiddleware,
);
export const apiKeyRateLimit = whenEnabled(apiKeyRateLimitMiddleware);
export const webhookRateLimit = whenEnabled(webhookRateLimitMiddleware);
