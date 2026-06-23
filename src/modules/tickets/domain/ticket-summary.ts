import type { TicketPriority, TicketStatus } from './ticket-enums.js';

export type TicketSummary = {
  total: number;
  open: number;
  inProgress: number;
  waitingCustomer: number;
  escalated: number;
  resolved: number;
  closed: number;
  overdue: number;
  unassigned: number;
  byStatus: Record<TicketStatus, number>;
  byPriority: Record<TicketPriority, number>;
};
