import type { Tenant } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export class TenantsRepository {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  }
}

export const tenantsRepository = new TenantsRepository();
