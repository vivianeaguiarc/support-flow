import { AppError } from '../../../shared/errors/app-error.js';
import type { Ticket } from './ticket.entity.js';

export const BULK_TICKET_OPERATION = {
  STATUS_UPDATE: 'bulk_status_update',
  ASSIGN: 'bulk_assign',
} as const;

export type BulkTicketOperation =
  (typeof BULK_TICKET_OPERATION)[keyof typeof BULK_TICKET_OPERATION];

export type BulkTicketOperationResult = {
  totalRequested: number;
  totalUpdated: number;
  updatedTicketIds: string[];
  operation: BulkTicketOperation;
  message: string;
};

/**
 * Ensures every requested ticket id was resolved within the tenant scope.
 *
 * Missing ids cover both nonexistent tickets and tickets that belong to another
 * tenant (the tenant-scoped query simply does not return them). Throwing here
 * aborts the bulk operation before any mutation, guaranteeing atomicity.
 */
export function assertAllTicketsPresent(
  requestedTicketIds: readonly string[],
  foundTickets: readonly Pick<Ticket, 'id'>[],
): void {
  const foundIds = new Set(foundTickets.map((ticket) => ticket.id));
  const missingTicketIds = requestedTicketIds.filter((id) => !foundIds.has(id));

  if (missingTicketIds.length > 0) {
    throw new AppError(
      'One or more tickets were not found in this tenant',
      404,
      true,
      undefined,
      { missingTicketIds },
    );
  }
}
