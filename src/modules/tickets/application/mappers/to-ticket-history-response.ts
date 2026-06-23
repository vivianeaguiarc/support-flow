import type { TicketHistoryWithActor } from '../../repositories/ticket-history.repository.js';

export type TicketHistoryActor = {
  name: string;
  email: string;
};

export type TicketHistoryEntry = {
  id: string;
  action: string;
  previousValue: string | null;
  newValue: string | null;
  performedById: string | null;
  performedBy: TicketHistoryActor | null;
  createdAt: Date;
};

export type TicketHistoryResult = {
  ticketId: string;
  history: TicketHistoryEntry[];
};

export function toTicketHistoryResult(
  ticketId: string,
  records: TicketHistoryWithActor[],
): TicketHistoryResult {
  return {
    ticketId,
    history: records.map((record) => ({
      id: record.id,
      action: record.event,
      previousValue: record.oldValue,
      newValue: record.newValue,
      performedById: record.changedById,
      performedBy: record.changedBy
        ? {
            name: record.changedBy.name,
            email: record.changedBy.email,
          }
        : null,
      createdAt: record.createdAt,
    })),
  };
}
