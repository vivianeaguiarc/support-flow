import type {
  TicketPriority,
  TicketStatus,
} from '../../domain/ticket-enums.js';

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
  overdue?: boolean;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
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
