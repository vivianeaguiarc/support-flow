import type { TicketCategory } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export class TicketCategoriesRepository {
  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<TicketCategory | null> {
    return prisma.ticketCategory.findFirst({
      where: { id, tenantId },
    });
  }
}

export const ticketCategoriesRepository = new TicketCategoriesRepository();
