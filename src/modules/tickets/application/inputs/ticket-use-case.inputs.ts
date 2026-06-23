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
  slaDueAt?: Date;
  changedById?: string;
};

export type ListTicketsByTenantInput = {
  tenantId: string;
};

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
