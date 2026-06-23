export const TicketPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TicketPriority =
  (typeof TicketPriority)[keyof typeof TicketPriority];

export const TICKET_PRIORITIES = Object.values(TicketPriority);

export const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TICKET_STATUSES = Object.values(TicketStatus);

export const TicketHistoryEvent = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  ASSIGNED: 'ASSIGNED',
  CATEGORY_CHANGED: 'CATEGORY_CHANGED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  ATTACHMENT_ADDED: 'ATTACHMENT_ADDED',
  ATTACHMENT_REMOVED: 'ATTACHMENT_REMOVED',
} as const;

export type TicketHistoryEvent =
  (typeof TicketHistoryEvent)[keyof typeof TicketHistoryEvent];

export const TICKET_HISTORY_EVENTS = Object.values(TicketHistoryEvent);

export const CommentVisibility = {
  INTERNAL: 'INTERNAL',
} as const;

export type CommentVisibility =
  (typeof CommentVisibility)[keyof typeof CommentVisibility];
