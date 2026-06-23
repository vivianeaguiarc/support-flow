import type { Customer } from '@prisma/client';

import { prisma } from '../../../shared/database/prisma.js';

export type CreateCustomerInput = {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
};

export class CustomersRepository {
  async findById(id: string): Promise<Customer | null> {
    return prisma.customer.findUnique({ where: { id } });
  }

  async findByEmail(tenantId: string, email: string): Promise<Customer | null> {
    return prisma.customer.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    return prisma.customer.create({ data });
  }
}

export const customersRepository = new CustomersRepository();
