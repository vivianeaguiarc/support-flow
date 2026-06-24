import type { Prisma } from '@prisma/client';

import type { CustomerListSortField } from '../dtos/list-customers-query.dto.js';

export function buildCustomerListOrderBy(
  sortBy: CustomerListSortField = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
): Prisma.CustomerOrderByWithRelationInput {
  return { [sortBy]: sortOrder };
}
