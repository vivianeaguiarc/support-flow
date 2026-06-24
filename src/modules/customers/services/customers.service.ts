import type { Customer } from '../domain/customer.entity.js';
import type { ListCustomersQueryDto } from '../dtos/list-customers-query.dto.js';
import {
  CustomersRepository,
  customersRepository as defaultCustomersRepository,
} from '../repositories/customers.repository.js';

export class CustomersService {
  constructor(
    private readonly repository: CustomersRepository = defaultCustomersRepository,
  ) {}

  async list(
    tenantId: string,
    query: ListCustomersQueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  ): Promise<{ data: Customer[]; total: number; page: number; limit: number }> {
    return this.repository.listWithFilters({
      tenantId,
      search: query.search,
      isActive: query.isActive,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }
}

export const customersService = new CustomersService();
