export type AgentMetrics = {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  openTickets: number;
  slaBreachedTickets: number;
};

export type AgentMetricsResult = {
  agents: AgentMetrics[];
};
