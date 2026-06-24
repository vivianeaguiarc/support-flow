import type { Customer, Tenant, TicketCategory, User } from '@prisma/client';

import {
  assignUserLegacyRole,
  seedRbacForTenant,
} from '../../../prisma/seed/rbac-seed.js';
import { DEFAULT_TENANT_ID } from '../../shared/constants/tenant.js';
import { hashPassword } from '../../shared/security/password-hash.js';
import { UserRole } from '../../shared/types/user-role.js';
import { integrationPrisma } from './database.js';

const DEFAULT_PASSWORD = 'Password123!';

export type IntegrationFixtures = {
  tenantA: Tenant;
  tenantB: Tenant;
  agentA: User;
  agentB: User;
  adminA: User;
  superAdmin: User;
  customerA: Customer;
  customerB: Customer;
  categoryA: TicketCategory;
  password: string;
};

export async function seedIntegrationFixtures(): Promise<IntegrationFixtures> {
  const password = DEFAULT_PASSWORD;
  const hashedPassword = await hashPassword(password);

  const tenantA = await integrationPrisma.tenant.create({
    data: {
      id: DEFAULT_TENANT_ID,
      name: 'Tenant Alpha',
      slug: `tenant-alpha-${Date.now()}`,
    },
  });

  const tenantARoles = await seedRbacForTenant(integrationPrisma, tenantA.id);

  const tenantB = await integrationPrisma.tenant.create({
    data: {
      name: 'Tenant Beta',
      slug: `tenant-beta-${Date.now()}`,
    },
  });

  const tenantBRoles = await seedRbacForTenant(integrationPrisma, tenantB.id);

  const agentA = await integrationPrisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Agent Alpha',
      email: `agent-alpha-${Date.now()}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.AGENT,
    },
  });

  await assignUserLegacyRole(integrationPrisma, {
    userId: agentA.id,
    tenantId: tenantA.id,
    legacyRole: UserRole.AGENT,
    roleIdByLegacy: tenantARoles,
  });

  const agentB = await integrationPrisma.user.create({
    data: {
      tenantId: tenantB.id,
      name: 'Agent Beta',
      email: `agent-beta-${Date.now()}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.AGENT,
    },
  });

  await assignUserLegacyRole(integrationPrisma, {
    userId: agentB.id,
    tenantId: tenantB.id,
    legacyRole: UserRole.AGENT,
    roleIdByLegacy: tenantBRoles,
  });

  const adminA = await integrationPrisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Admin Alpha',
      email: `admin-alpha-${Date.now()}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  await assignUserLegacyRole(integrationPrisma, {
    userId: adminA.id,
    tenantId: tenantA.id,
    legacyRole: UserRole.ADMIN,
    roleIdByLegacy: tenantARoles,
  });

  const superAdmin = await integrationPrisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Super Admin',
      email: `super-admin-${Date.now()}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const customerA = await integrationPrisma.customer.create({
    data: {
      tenantId: tenantA.id,
      name: 'Customer Alpha',
      email: `customer-alpha-${Date.now()}@supportflow.test`,
    },
  });

  const customerB = await integrationPrisma.customer.create({
    data: {
      tenantId: tenantB.id,
      name: 'Customer Beta',
      email: `customer-beta-${Date.now()}@supportflow.test`,
    },
  });

  const categoryA = await integrationPrisma.ticketCategory.create({
    data: {
      tenantId: tenantA.id,
      name: `Category-${Date.now()}`,
      description: 'Integration test category',
      slaHours: 120,
    },
  });

  return {
    tenantA,
    tenantB,
    agentA,
    agentB,
    adminA,
    superAdmin,
    customerA,
    customerB,
    categoryA,
    password,
  };
}
