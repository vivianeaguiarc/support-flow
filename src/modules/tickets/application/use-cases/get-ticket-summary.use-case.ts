import type { TicketListFilters } from '../../domain/ticket-list-filters.js';
import type { TicketSummary } from '../../domain/ticket-summary.js';
import { getTicketSummary } from '../../repositories/get-ticket-summary.repository.js';

export class GetTicketSummaryUseCase {
  async execute(filters: TicketListFilters): Promise<TicketSummary> {
    return getTicketSummary(filters);
  }
}

export const getTicketSummaryUseCase = new GetTicketSummaryUseCase();
