import type {
  TicketPriority,
  TicketStatus,
} from '../../domain/ticket-enums.js';
import type {
  TicketListSortField,
  TicketListSortOrder,
} from '../../domain/ticket-list-sort.js';
import type { AssigneeTeamRole } from '../../domain/ticket-queue-filters.js';

export type OpenTicketInput = {
  tenantId: string;
  title: string;
  description: string;
  customerId: string;
  priority?: TicketPriority;
  categoryId?: string;
  assignedToId?: string;
  changedById?: string;
};

export type ListTicketsInput = {
  tenantId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  customerId?: string;
  assignedToId?: string;
  unassigned?: boolean;
  team?: AssigneeTeamRole;
  overdue?: boolean;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: TicketListSortField;
  sortOrder?: TicketListSortOrder;
};

export type ListTicketsQueryInput = Omit<ListTicketsInput, 'tenantId'>;

export type TicketSummaryQueryInput = Omit<
  ListTicketsInput,
  'tenantId' | 'page' | 'limit' | 'sortBy' | 'sortOrder'
>;

export type QueueTicketsQueryInput = Pick<
  ListTicketsQueryInput,
  'status' | 'priority' | 'page' | 'limit' | 'sortBy' | 'sortOrder'
>;

export type TicketMetricsQueryInput = {
  categoryId?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

/** @deprecated Use ListTicketsInput */
export type ListTicketsByTenantInput = Pick<ListTicketsInput, 'tenantId'>;

export type FindTicketByIdInput = {
  tenantId: string;
  ticketId: string;
};

export type UpdateTicketStatusInput = {
  tenantId: string;
  ticketId: string;
  status: TicketStatus;
  changedById?: string;
};

export type AssignTicketInput = {
  tenantId: string;
  ticketId: string;
  assignedToId: string;
  changedById?: string;
};
