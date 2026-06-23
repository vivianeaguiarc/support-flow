import type {
  Customer,
  Tenant,
  Ticket,
  TicketCategory,
  TicketHistory,
  TicketHistoryEvent,
} from '@prisma/client';

export type {
  Customer,
  Tenant,
  Ticket,
  TicketCategory,
  TicketHistory,
  TicketHistoryEvent,
};

export type {
  CreateTicketDomainInput,
  RecordTicketHistoryInput,
} from './ticket.types.js';
export {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from './ticket-enums.js';
export { assertAssigneeRequiredForInProgress } from './ticket-in-progress.rules.js';
export { generateTicketProtocol } from './ticket-protocol.js';
export {
  assertValidTicketStatusTransition,
  getAllowedTicketStatusTransitions,
} from './ticket-status-transitions.js';
