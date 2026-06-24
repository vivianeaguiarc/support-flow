/**
 * Canonical action identifiers for the immutable audit trail.
 * Stored in the `action` column of {@link AuditLog}.
 */
export const AuditAction = {
  // Authentication / authorization
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGIN_LOCKED: 'auth.login_locked',
  ACCESS_DENIED: 'access.denied',

  // API keys
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',

  // Roles & permissions
  USER_PERMISSION_ASSIGNED: 'user.permission_assigned',
  ROLE_CREATED: 'role.created',
  ROLE_UPDATED: 'role.updated',
  ROLE_DELETED: 'role.deleted',
  ROLE_PERMISSIONS_UPDATED: 'role.permissions_updated',

  // Tickets
  TICKET_CREATED: 'ticket.created',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_RESOLVED: 'ticket.resolved',
  TICKET_CLOSED: 'ticket.closed',

  // Webhooks
  WEBHOOK_CREATED: 'webhook.created',
  WEBHOOK_UPDATED: 'webhook.updated',
  WEBHOOK_DELETED: 'webhook.deleted',

  // Automation rules
  AUTOMATION_RULE_CREATED: 'automation_rule.created',
  AUTOMATION_RULE_UPDATED: 'automation_rule.updated',
  AUTOMATION_RULE_DELETED: 'automation_rule.deleted',
} as const;

export type AuditActionValue = (typeof AuditAction)[keyof typeof AuditAction];

/**
 * Canonical entity identifiers for the immutable audit trail.
 * Stored in the `entity` column of {@link AuditLog}.
 */
export const AuditEntity = {
  AUTH: 'auth',
  AUTHORIZATION: 'authorization',
  API_KEY: 'api_key',
  USER: 'user',
  ROLE: 'role',
  TICKET: 'ticket',
  WEBHOOK: 'webhook',
  AUTOMATION_RULE: 'automation_rule',
} as const;

export type AuditEntityValue = (typeof AuditEntity)[keyof typeof AuditEntity];
