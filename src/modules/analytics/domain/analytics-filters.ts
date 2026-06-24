import type {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

export type AnalyticsFilters = {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  status?: TicketStatus;
  priority?: TicketPriority;
  agentId?: string;
};
