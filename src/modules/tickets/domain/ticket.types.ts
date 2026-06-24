import type { Prisma } from '@prisma/client';

import type { TicketHistoryEvent, TicketPriority } from './ticket-enums.js';

export type CreateTicketDomainInput = {
  tenantId: string;
  protocol: string;
  title: string;
  description: string;
  customerId: string;
  priority?: TicketPriority;
  categoryId?: string;
  assignedToId?: string;
  slaDueAt?: Date;
};

export type RecordTicketHistoryInput = {
  tenantId: string;
  ticketId: string;
  event: TicketHistoryEvent;
  field?: string;
  oldValue?: string;
  newValue?: string;
  changedById?: string;
  metadata?: Prisma.InputJsonValue;
};
