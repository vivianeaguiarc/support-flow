import type { PrismaClient } from '@prisma/client';

import { hashPassword } from '../../src/shared/security/password-hash.js';
import { UserRole } from '../../src/shared/types/user-role.js';
import {
  DEMO_ADMIN_USER_ID,
  DEMO_AGENT_USER_ID,
  resolveSeedConfig,
  type SeedConfig,
} from './config.js';

export type DemoCategorySeed = {
  name: string;
  description: string;
  slaHours: number;
};

export const DEMO_CATEGORIES: DemoCategorySeed[] = [
  {
    name: 'SAC Geral',
    description: 'Atendimento geral ao cliente',
    slaHours: 72,
  },
  {
    name: 'Ouvidoria',
    description: 'Manifestações e reclamações institucionais',
    slaHours: 48,
  },
  {
    name: 'Suporte Técnico',
    description: 'Incidentes técnicos e suporte operacional',
    slaHours: 24,
  },
];

export type DemoSeedResult = {
  tenantId: string;
  tenantSlug: string;
  adminEmail: string;
  agentEmail: string;
  customerId: string;
  customerEmail: string;
  categoryNames: string[];
};

export async function seedDemoData(
  prisma: PrismaClient,
  config: SeedConfig = resolveSeedConfig(),
): Promise<DemoSeedResult> {
  const [adminPasswordHash, agentPasswordHash] = await Promise.all([
    hashPassword(config.adminPassword),
    hashPassword(config.agentPassword),
  ]);

  await prisma.tenant.upsert({
    where: { id: config.tenantId },
    create: {
      id: config.tenantId,
      name: config.tenantName,
      slug: config.tenantSlug,
      defaultSlaHours: config.defaultSlaHours,
      isActive: true,
    },
    update: {
      name: config.tenantName,
      slug: config.tenantSlug,
      defaultSlaHours: config.defaultSlaHours,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.adminEmail,
      },
    },
    create: {
      id: DEMO_ADMIN_USER_ID,
      tenantId: config.tenantId,
      name: config.adminName,
      email: config.adminEmail,
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    update: {
      name: config.adminName,
      password: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.agentEmail,
      },
    },
    create: {
      id: DEMO_AGENT_USER_ID,
      tenantId: config.tenantId,
      name: config.agentName,
      email: config.agentEmail,
      password: agentPasswordHash,
      role: UserRole.AGENT,
    },
    update: {
      name: config.agentName,
      password: agentPasswordHash,
      role: UserRole.AGENT,
    },
  });

  await prisma.customer.upsert({
    where: {
      tenantId_email: {
        tenantId: config.tenantId,
        email: config.customerEmail,
      },
    },
    create: {
      id: config.customerId,
      tenantId: config.tenantId,
      name: config.customerName,
      email: config.customerEmail,
      isActive: true,
    },
    update: {
      name: config.customerName,
      isActive: true,
    },
  });

  for (const category of DEMO_CATEGORIES) {
    await prisma.ticketCategory.upsert({
      where: {
        tenantId_name: {
          tenantId: config.tenantId,
          name: category.name,
        },
      },
      create: {
        tenantId: config.tenantId,
        name: category.name,
        description: category.description,
        slaHours: category.slaHours,
        isActive: true,
      },
      update: {
        description: category.description,
        slaHours: category.slaHours,
        isActive: true,
      },
    });
  }

  return {
    tenantId: config.tenantId,
    tenantSlug: config.tenantSlug,
    adminEmail: config.adminEmail,
    agentEmail: config.agentEmail,
    customerId: config.customerId,
    customerEmail: config.customerEmail,
    categoryNames: DEMO_CATEGORIES.map((category) => category.name),
  };
}
