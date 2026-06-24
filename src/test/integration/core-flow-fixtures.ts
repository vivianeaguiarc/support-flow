import { randomUUID } from 'node:crypto';

import type { Customer, Tenant, TicketCategory, User } from '@prisma/client';

import { DEFAULT_TENANT_ID } from '../../shared/constants/tenant.js';
import { hashPassword } from '../../shared/security/password-hash.js';
import { UserRole } from '../../shared/types/user-role.js';
import { integrationPrisma } from './database.js';

export const CORE_FLOW_PASSWORD = 'DemoSupport123!';

export type CoreFlowFixtures = {
  tenant: Tenant;
  admin: User;
  agent: User;
  customerUser: User;
  customer: Customer;
  otherCustomer: Customer;
  category: TicketCategory;
  password: string;
};

export async function seedCoreFlowFixtures(): Promise<CoreFlowFixtures> {
  const password = CORE_FLOW_PASSWORD;
  const hashedPassword = await hashPassword(password);
  const suffix = Date.now();

  const tenant = await integrationPrisma.tenant.create({
    data: {
      id: DEFAULT_TENANT_ID,
      name: 'Core Flow Tenant',
      slug: `core-flow-${suffix}`,
    },
  });

  const admin = await integrationPrisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Core Flow Admin',
      email: `admin-core-${suffix}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  const agent = await integrationPrisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Core Flow Agent',
      email: `agent-core-${suffix}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.AGENT,
    },
  });

  const customerId = randomUUID();

  const customerUser = await integrationPrisma.user.create({
    data: {
      id: customerId,
      tenantId: tenant.id,
      name: 'Core Flow Customer User',
      email: `customer-core-${suffix}@supportflow.test`,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    },
  });

  const customer = await integrationPrisma.customer.create({
    data: {
      id: customerId,
      tenantId: tenant.id,
      name: 'Core Flow Customer',
      email: `customer-entity-${suffix}@supportflow.test`,
    },
  });

  const otherCustomer = await integrationPrisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: 'Other Customer',
      email: `other-customer-${suffix}@supportflow.test`,
    },
  });

  const category = await integrationPrisma.ticketCategory.create({
    data: {
      tenantId: tenant.id,
      name: `Core-Category-${suffix}`,
      description: 'Category for core flow E2E tests',
      slaHours: 48,
    },
  });

  return {
    tenant,
    admin,
    agent,
    customerUser,
    customer,
    otherCustomer,
    category,
    password,
  };
}
