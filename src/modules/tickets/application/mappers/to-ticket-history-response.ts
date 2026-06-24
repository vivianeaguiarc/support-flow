import type { TicketHistoryWithActor } from '../../infrastructure/repositories/ticket-history.repository.js';

export type TicketHistoryEntry = {
  id: string;
  ticketId: string;
  actorId: string | null;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type TicketHistoryResult = {
  ticketId: string;
  history: TicketHistoryEntry[];
};

function toMetadataRecord(
  metadata: TicketHistoryWithActor['metadata'],
): Record<string, unknown> | null {
  if (metadata === null || metadata === undefined) {
    return null;
  }

  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }

  return { value: metadata };
}

export function toTicketHistoryResult(
  ticketId: string,
  records: TicketHistoryWithActor[],
): TicketHistoryResult {
  return {
    ticketId,
    history: records.map((record) => ({
      id: record.id,
      ticketId: record.ticketId,
      actorId: record.changedById,
      action: record.event,
      oldValue: record.oldValue,
      newValue: record.newValue,
      metadata: toMetadataRecord(record.metadata),
      createdAt: record.createdAt,
    })),
  };
}
