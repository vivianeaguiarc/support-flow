import type { AgentMetricsResult } from '../../domain/agent-metrics.js';
import { getAgentMetrics as getAgentMetricsFromDb } from '../../infrastructure/repositories/get-agent-metrics.repository.js';

export class GetAgentMetricsUseCase {
  async execute(tenantId: string): Promise<AgentMetricsResult> {
    return getAgentMetricsFromDb(tenantId);
  }
}

export const getAgentMetricsUseCase = new GetAgentMetricsUseCase();
