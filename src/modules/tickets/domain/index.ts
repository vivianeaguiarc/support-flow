export type { Tenant } from './tenant.entity.js';
export type { Ticket } from './ticket.entity.js';
export type {
  CreateTicketDomainInput,
  RecordTicketHistoryInput,
} from './ticket.types.js';
export type {
  AllowedMimeType,
  TicketAttachment,
  TicketAttachmentWithUploader,
} from './ticket-attachment.js';
export {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './ticket-attachment.js';
export type { TicketCategory } from './ticket-category.entity.js';
export type {
  TicketComment,
  TicketCommentWithAuthor,
} from './ticket-comment.js';
export {
  CommentVisibility,
  TICKET_HISTORY_EVENTS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from './ticket-enums.js';
export { assertAssigneeRequiredForInProgress } from './ticket-in-progress.rules.js';
export type { TicketListFilters } from './ticket-list-filters.js';
export type { TicketMetrics } from './ticket-metrics.js';
export type { PaginatedTicketList } from './ticket-paginated-list.js';
export { generateTicketProtocol } from './ticket-protocol.js';
export {
  calculateSlaDueAt,
  DEFAULT_SLA_FALLBACK_HOURS,
  PRIORITY_SLA_HOURS,
  resolveSlaHours,
} from './ticket-sla.js';
export {
  assertValidTicketStatusTransition,
  getAllowedTicketStatusTransitions,
} from './ticket-status-transitions.js';
export type { TicketSummary } from './ticket-summary.js';
