import type { TicketHistory } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';
import type { RecordTicketHistoryInput } from '../domain/ticket.types.js';

export class TicketHistoryRepository {
  async create(data: RecordTicketHistoryInput): Promise<TicketHistory> {
    return prisma.ticketHistory.create({ data });
  }

  async listByTicketId(ticketId: string): Promise<TicketHistory[]> {
    return prisma.ticketHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

export const ticketHistoryRepository = new TicketHistoryRepository();
