import type { Tenant } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';

export class TenantsRepository {
  async findById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { id } });
  }

  async findActiveById(id: string): Promise<Tenant | null> {
    return prisma.tenant.findFirst({
      where: { id, isActive: true },
    });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findUnique({ where: { slug } });
  }

  async findActiveBySlug(slug: string): Promise<Tenant | null> {
    return prisma.tenant.findFirst({
      where: { slug, isActive: true },
    });
  }

  async resolveFromHint(hint: {
    tenantId?: string;
    tenantSlug?: string;
  }): Promise<Tenant | null> {
    if (hint.tenantId) {
      return this.findActiveById(hint.tenantId);
    }

    if (hint.tenantSlug) {
      return this.findActiveBySlug(hint.tenantSlug);
    }

    return null;
  }
}

export const tenantsRepository = new TenantsRepository();
