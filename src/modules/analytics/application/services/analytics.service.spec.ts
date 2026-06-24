import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../../../../shared/types/user-role.js';
import { TicketStatus } from '../../../tickets/domain/ticket-enums.js';
import type { AnalyticsRepository } from '../infrastructure/repositories/analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';

describe('AnalyticsService', () => {
  const repository: AnalyticsRepository = {
    getOverview: vi.fn(),
    getTicketsByStatus: vi.fn(),
    getTicketsByPriority: vi.fn(),
    getSla: vi.fn(),
    getAgentsPerformance: vi.fn(),
  };

  const authUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass tenant filters to overview repository', async () => {
    vi.mocked(repository.getOverview).mockResolvedValue({
      totalTickets: 10,
      openTickets: 3,
      inProgressTickets: 2,
      resolvedTickets: 4,
      closedTickets: 1,
      slaBreachedTickets: 1,
      slaComplianceRate: 80,
      avgResolutionTimeHours: 5,
      ticketsCreatedByPeriod: [],
    });

    const service = new AnalyticsService(repository);
    const startDate = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-06-30T23:59:59.999Z');

    await service.getOverview(authUser, {
      startDate,
      endDate,
      status: TicketStatus.OPEN,
      agentId: 'agent-1',
    });

    expect(repository.getOverview).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      startDate,
      endDate,
      status: TicketStatus.OPEN,
      priority: undefined,
      agentId: 'agent-1',
    });
  });

  it('should delegate agents performance query', async () => {
    vi.mocked(repository.getAgentsPerformance).mockResolvedValue({
      agents: [],
    });

    const service = new AnalyticsService(repository);

    await service.getAgentsPerformance(authUser, {});

    expect(repository.getAgentsPerformance).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      startDate: undefined,
      endDate: undefined,
      status: undefined,
      priority: undefined,
      agentId: undefined,
    });
  });
});
