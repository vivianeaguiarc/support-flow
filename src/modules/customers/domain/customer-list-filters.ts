import type { CustomerListSortField } from '../dtos/list-customers-query.dto.js';

export type CustomerListFilters = {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: CustomerListSortField;
  sortOrder?: 'asc' | 'desc';
};
