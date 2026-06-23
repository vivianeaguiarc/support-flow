import type { Ticket } from '@prisma/client';

import { AppError } from '../errors/app-error.js';

export function assertTicketForTenant(
  ticket: Ticket | null,
  tenantId: string,
): Ticket {
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.tenantId !== tenantId) {
    throw new AppError('Forbidden', 403);
  }

  return ticket;
}
