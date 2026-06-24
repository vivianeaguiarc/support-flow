import type { Prisma } from '@prisma/client';

import type { UserListSortField } from '../dtos/list-users-query.dto.js';

export function buildUserListOrderBy(
  sortBy: UserListSortField = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
): Prisma.UserOrderByWithRelationInput {
  return { [sortBy]: sortOrder };
}
