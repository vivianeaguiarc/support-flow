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
  KNOWLEDGE_ARTICLE_CREATED: 'knowledge.article.created',
  KNOWLEDGE_ARTICLE_UPDATED: 'knowledge.article.updated',
  KNOWLEDGE_ARTICLE_PUBLISHED: 'knowledge.article.published',
  KNOWLEDGE_ARTICLE_ARCHIVED: 'knowledge.article.archived',
  KNOWLEDGE_ARTICLE_DELETED: 'knowledge.article.deleted',
  REPORT_TICKETS_EXPORTED: 'report.tickets.exported',
  REPORT_AGENTS_PERFORMANCE_EXPORTED: 'report.agents_performance.exported',
  REPORT_SLA_EXPORTED: 'report.sla.exported',
  AUTOMATION_RULE_CREATED: 'automation.rule.created',
  AUTOMATION_RULE_UPDATED: 'automation.rule.updated',
  AUTOMATION_RULE_DELETED: 'automation.rule.deleted',
  AUTOMATION_RULE_EXECUTED: 'automation.rule.executed',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  API_KEY_DELETED: 'api_key.deleted',
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_UPDATED: 'webhook.updated',
  WEBHOOK_DELETED: 'webhook.deleted',
  WEBHOOK_TEST_SENT: 'webhook.test_sent',
  WEBHOOK_DELIVERED: 'webhook.delivered',
  WEBHOOK_DELIVERY_FAILED: 'webhook.delivery_failed',
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
    ...(context?.correlationId ? { correlationId: context.correlationId } : {}),
    ...(context?.method ? { method: context.method } : {}),
    ...(context?.path ? { path: context.path } : {}),
  });

  logger.info(payload, event);
}
