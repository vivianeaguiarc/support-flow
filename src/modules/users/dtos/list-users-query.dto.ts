import { z } from 'zod';

import {
  createdAtRangeQueryFields,
  paginationQueryFields,
  withCreatedAtRangeRefine,
} from '../../../shared/http/dtos/pagination-query.dto.js';
import { UserRole } from '../../../shared/types/user-role.js';

export const USER_LIST_SORT_FIELDS = [
  'name',
  'email',
  'createdAt',
  'role',
] as const;

export type UserListSortField = (typeof USER_LIST_SORT_FIELDS)[number];

export const listUsersQuerySchema = withCreatedAtRangeRefine(
  z.object({
    page: paginationQueryFields.page,
    limit: paginationQueryFields.limit,
    sortOrder: paginationQueryFields.sortOrder,
    search: paginationQueryFields.search,
    createdFrom: createdAtRangeQueryFields.createdFrom,
    createdTo: createdAtRangeQueryFields.createdTo,
    sortBy: z.enum(USER_LIST_SORT_FIELDS).default('createdAt'),
    role: z
      .enum(
        Object.values(UserRole) as [
          (typeof UserRole)[keyof typeof UserRole],
          ...(typeof UserRole)[keyof typeof UserRole][],
        ],
      )
      .optional(),
  }),
);

export type ListUsersQueryDto = z.infer<typeof listUsersQuerySchema>;
