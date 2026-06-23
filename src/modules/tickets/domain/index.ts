import type {
  Customer,
  Tenant,
  Ticket,
  TicketCategory,
  TicketHistory,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '@prisma/client';

export type {
  Customer,
  Tenant,
  Ticket,
  TicketCategory,
  TicketHistory,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
};

export type {
  CreateTicketDomainInput,
  RecordTicketHistoryInput,
} from './ticket.types.js';
export { generateTicketProtocol } from './ticket-protocol.js';
export {
  assertValidTicketStatusTransition,
  getAllowedTicketStatusTransitions,
} from './ticket-status-transitions.js';
