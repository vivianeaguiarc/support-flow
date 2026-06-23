import type { TicketMetrics } from '../../domain/ticket-metrics.js';
import type { GetTicketMetricsFilters } from '../../infrastructure/repositories/get-ticket-metrics.repository.js';
import { getTicketMetrics } from '../../infrastructure/repositories/get-ticket-metrics.repository.js';

export class GetTicketMetricsUseCase {
  async execute(filters: GetTicketMetricsFilters): Promise<TicketMetrics> {
    return getTicketMetrics(filters);
  }
}

export const getTicketMetricsUseCase = new GetTicketMetricsUseCase();
