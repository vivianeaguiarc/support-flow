import type { UserRole } from '../../../shared/types/user-role.js';
import type { UserListSortField } from '../dtos/list-users-query.dto.js';

export type UserListFilters = {
  tenantId: string;
  search?: string;
  role?: UserRole;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: UserListSortField;
  sortOrder?: 'asc' | 'desc';
};
