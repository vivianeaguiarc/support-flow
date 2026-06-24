import type { TicketCategoryListSortField } from '../presentation/dtos/list-ticket-categories-query.dto.js';

export type TicketCategoryListFilters = {
  tenantId: string;
  search?: string;
  isActive?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: TicketCategoryListSortField;
  sortOrder?: 'asc' | 'desc';
};
