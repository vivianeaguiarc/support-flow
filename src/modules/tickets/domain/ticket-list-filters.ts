import type { TicketPriority, TicketStatus } from './ticket-enums.js';

export type TicketListFilters = {
  tenantId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  customerId?: string;
  assignedToId?: string;
  unassigned?: boolean;
  overdue?: boolean;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
};
