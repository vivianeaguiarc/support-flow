import type { TicketPriority, TicketStatus } from './ticket-enums.js';

export type Ticket = {
  id: string;
  tenantId: string;
  protocol: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string | null;
  customerId: string;
  assignedToId: string | null;
  slaDueAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
