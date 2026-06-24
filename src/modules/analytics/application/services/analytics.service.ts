import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { AnalyticsFilters } from '../../domain/analytics-filters.js';
import type {
  AnalyticsAgentsPerformance,
  AnalyticsCsat,
  AnalyticsOverview,
  AnalyticsSla,
  AnalyticsTicketsByPriority,
  AnalyticsTicketsByStatus,
} from '../../domain/analytics-types.js';
import type { CsatFilters } from '../../domain/csat-filters.js';
import {
  AnalyticsRepository,
  analyticsRepository as defaultAnalyticsRepository,
} from '../../infrastructure/repositories/analytics.repository.js';
import {
  CsatAnalyticsRepository,
  csatAnalyticsRepository as defaultCsatAnalyticsRepository,
} from '../../infrastructure/repositories/csat-analytics.repository.js';
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

function toCsatFilters(
  authUser: AuthenticatedUser,
  query: AnalyticsQueryDto,
): CsatFilters {
  const agentId =
    authUser.role === UserRole.AGENT ? authUser.id : query.agentId;

  return {
    tenantId: authUser.tenantId,
    startDate: query.startDate,
    endDate: query.endDate,
    agentId,
  };
}

export class AnalyticsService {
  constructor(
    private readonly repository: AnalyticsRepository = defaultAnalyticsRepository,
    private readonly csatRepository: CsatAnalyticsRepository = defaultCsatAnalyticsRepository,
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

  async getCsat(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsCsat> {
    return this.csatRepository.getCsat(toCsatFilters(authUser, query));
  }
}

export const analyticsService = new AnalyticsService();
