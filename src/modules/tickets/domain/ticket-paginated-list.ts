import type { Ticket } from './ticket.entity.js';

export type PaginatedTicketList = {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
};
