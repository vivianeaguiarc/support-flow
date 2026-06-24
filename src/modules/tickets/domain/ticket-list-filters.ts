import type { TicketPriority, TicketStatus } from './ticket-enums.js';
import type {
  TicketListSortField,
  TicketListSortOrder,
} from './ticket-list-sort.js';
import type { AssigneeTeamRole } from './ticket-queue-filters.js';

export type TicketListFilters = {
  tenantId: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  customerId?: string;
  assignedToId?: string;
  unassigned?: boolean;
  team?: AssigneeTeamRole;
  overdue?: boolean;
  search?: string;
  createdFrom?: Date;
  createdTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: TicketListSortField;
  sortOrder?: TicketListSortOrder;
};
