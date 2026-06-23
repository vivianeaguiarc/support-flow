export const NotificationType = {
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_STATUS_CHANGED: 'TICKET_STATUS_CHANGED',
  TICKET_COMMENT_ADDED: 'TICKET_COMMENT_ADDED',
  TICKET_ATTACHMENT_ADDED: 'TICKET_ATTACHMENT_ADDED',
  SLA_WARNING: 'SLA_WARNING',
  SLA_EXPIRED: 'SLA_EXPIRED',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NOTIFICATION_TYPES = Object.values(NotificationType);
