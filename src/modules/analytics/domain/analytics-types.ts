import type {
  TicketPriority,
  TicketStatus,
} from '../../tickets/domain/ticket-enums.js';

export type AnalyticsPeriodCount = {
  period: string;
  count: number;
};

export type AnalyticsOverview = {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  slaBreachedTickets: number;
  slaComplianceRate: number;
  avgResolutionTimeHours: number;
  ticketsCreatedByPeriod: AnalyticsPeriodCount[];
};

export type AnalyticsTicketsByStatus = {
  total: number;
  byStatus: Record<TicketStatus, number>;
};

export type AnalyticsTicketsByPriority = {
  total: number;
  byPriority: Record<TicketPriority, number>;
};

export type AnalyticsSla = {
  onTime: number;
  warning: number;
  breached: number;
  total: number;
  slaComplianceRate: number;
  slaBreachedTickets: number;
};

export type AgentPerformanceMetrics = {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  openTickets: number;
  slaBreachedTickets: number;
  avgResolutionTimeHours: number;
};

export type AnalyticsAgentsPerformance = {
  agents: AgentPerformanceMetrics[];
};

export type CsatRatingDistribution = {
  rating: number;
  count: number;
};

export type CsatAgentAverage = {
  agentId: string;
  agentName: string;
  averageRating: number;
  totalSurveys: number;
};

export type CsatPeriodAverage = {
  period: string;
  averageRating: number;
  count: number;
};

export type AnalyticsCsat = {
  averageRating: number;
  totalSurveys: number;
  distribution: CsatRatingDistribution[];
  byAgent: CsatAgentAverage[];
  byPeriod: CsatPeriodAverage[];
};
