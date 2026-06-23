import { logger } from './logger.js';
import { getRequestContext } from './request-context.js';
import { sanitizeLogData } from './sensitive-redaction.js';

export const BusinessEvent = {
  TICKET_CREATED: 'ticket.created',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_ESCALATED: 'ticket.escalated',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_REFRESH_FAILED: 'auth.refresh_failed',
  AUTH_UNAUTHORIZED: 'auth.unauthorized',
} as const;

export type BusinessEventName =
  (typeof BusinessEvent)[keyof typeof BusinessEvent];

export function logBusinessEvent(
  event: BusinessEventName,
  data: Record<string, unknown> = {},
): void {
  const context = getRequestContext();
  const payload = sanitizeLogData({
    event,
    ...data,
    ...(context?.requestId ? { requestId: context.requestId } : {}),
    ...(context?.method ? { method: context.method } : {}),
    ...(context?.path ? { path: context.path } : {}),
  });

  logger.info(payload, event);
}
