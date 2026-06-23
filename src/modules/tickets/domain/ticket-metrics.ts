export type AgentPerformance = {
  agentId: string;
  agentName: string;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
};

export type TicketMetrics = {
  avgResolutionTimeHours: number;
  slaComplianceRate: number;
  resolvedTickets: number;
  overdueTickets: number;
  agentPerformance: AgentPerformance[];
};
