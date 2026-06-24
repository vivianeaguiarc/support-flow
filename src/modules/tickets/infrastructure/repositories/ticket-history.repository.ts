import type { TicketHistory, TicketHistoryEvent, User } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import type { RecordTicketHistoryInput } from '../../domain/ticket.types.js';

export type TicketHistoryWithActor = TicketHistory & {
  changedBy: Pick<User, 'id' | 'name' | 'email'> | null;
};

export class TicketHistoryRepository {
  async create(
    data: RecordTicketHistoryInput,
    tx?: Prisma.TransactionClient,
  ): Promise<TicketHistory> {
    const client = tx ?? prisma;
    return client.ticketHistory.create({ data });
  }

  async listByTicketId(ticketId: string): Promise<TicketHistory[]> {
    return prisma.ticketHistory.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listByTicketIdAndTenant(
    ticketId: string,
    tenantId: string,
  ): Promise<TicketHistoryWithActor[]> {
    return prisma.ticketHistory.findMany({
      where: { ticketId, tenantId },
      include: {
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async hasEventByTicketId(
    ticketId: string,
    event: TicketHistoryEvent,
  ): Promise<boolean> {
    const count = await prisma.ticketHistory.count({
      where: { ticketId, event },
    });

    return count > 0;
  }
}

export const ticketHistoryRepository = new TicketHistoryRepository();
