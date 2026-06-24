import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { AnalyticsFilters } from '../../domain/analytics-filters.js';
import type {
  AnalyticsAgentsPerformance,
  AnalyticsOverview,
  AnalyticsSla,
  AnalyticsTicketsByPriority,
  AnalyticsTicketsByStatus,
} from '../../domain/analytics-types.js';
import {
  AnalyticsRepository,
  analyticsRepository as defaultAnalyticsRepository,
} from '../../infrastructure/repositories/analytics.repository.js';
import type { AnalyticsQueryDto } from '../../presentation/dtos/analytics-query.dto.js';

function toFilters(
  authUser: AuthenticatedUser,
  query: AnalyticsQueryDto,
): AnalyticsFilters {
  return {
    tenantId: authUser.tenantId,
    startDate: query.startDate,
    endDate: query.endDate,
    status: query.status,
    priority: query.priority,
    agentId: query.agentId,
  };
}

export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository = defaultAnalyticsRepository,
  ) {}

  async getOverview(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsOverview> {
    return this.repository.getOverview(toFilters(authUser, query));
  }

  async getTicketsByStatus(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsTicketsByStatus> {
    return this.repository.getTicketsByStatus(toFilters(authUser, query));
  }

  async getTicketsByPriority(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsTicketsByPriority> {
    return this.repository.getTicketsByPriority(toFilters(authUser, query));
  }

  async getSla(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsSla> {
    return this.repository.getSla(toFilters(authUser, query));
  }

  async getAgentsPerformance(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsAgentsPerformance> {
    return this.repository.getAgentsPerformance(toFilters(authUser, query));
  }
}

export const analyticsService = new AnalyticsService();
