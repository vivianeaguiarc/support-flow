import { AppError } from '../errors/app-error.js';

type TenantScopedResource = {
  tenantId: string;
};

export function assertTicketForTenant<T extends TenantScopedResource>(
  ticket: T | null,
  tenantId: string,
): T {
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.tenantId !== tenantId) {
    throw new AppError('Forbidden', 403);
  }

  return ticket;
}
