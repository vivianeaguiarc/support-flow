import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../../../../shared/types/user-role.js';
import type { AnalyticsService } from '../../../analytics/application/services/analytics.service.js';
import type { ReportsRepository } from '../../infrastructure/repositories/reports.repository.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  const reportsRepo: ReportsRepository = {
    getTicketCsvHeaders: vi.fn().mockReturnValue('protocol,title'),
    getSlaCsvHeaders: vi.fn().mockReturnValue('protocol,slaStatus'),
    formatTicketCsvRow: vi.fn().mockReturnValue('TK-001,Title'),
    formatSlaCsvRow: vi.fn().mockReturnValue('TK-001,ON_TIME'),
    streamTicketRows: vi.fn(),
    streamSlaRows: vi.fn(),
  };

  const analyticsService = {
    getAgentsPerformance: vi.fn(),
  } as unknown as AnalyticsService;

  const authUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant-1',
  };

  const createResponse = () => {
    const res = {
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
    } as unknown as Response;

    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should stream tickets csv with download headers', async () => {
    async function* ticketRows() {
      yield {
        protocol: 'TK-001',
        title: 'Title',
        status: 'OPEN',
        priority: 'HIGH',
        customerName: 'Customer',
        customerEmail: 'customer@test.com',
        agentName: 'Agent',
        categoryName: '',
        slaDueAt: null,
        closedAt: null,
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        updatedAt: new Date('2026-06-01T10:00:00.000Z'),
      };
    }

    vi.mocked(reportsRepo.streamTicketRows).mockReturnValue(ticketRows());

    const res = createResponse();
    const service = new ReportsService(reportsRepo, analyticsService);

    await service.exportTicketsCsv(authUser, {}, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="tickets.csv"',
    );
    expect(res.write).toHaveBeenCalledWith('protocol,title\n');
    expect(res.write).toHaveBeenCalledWith('TK-001,Title\n');
    expect(res.end).toHaveBeenCalled();
  });

  it('should export agents performance csv from analytics service', async () => {
    vi.mocked(analyticsService.getAgentsPerformance).mockResolvedValue({
      agents: [
        {
          agentId: 'agent-1',
          agentName: 'Agent 1',
          assignedTickets: 3,
          resolvedTickets: 2,
          openTickets: 1,
          slaBreachedTickets: 0,
          avgResolutionTimeHours: 4,
        },
      ],
    });

    const res = createResponse();
    const service = new ReportsService(reportsRepo, analyticsService);

    await service.exportAgentsPerformanceCsv(authUser, {}, res);

    expect(analyticsService.getAgentsPerformance).toHaveBeenCalledWith(
      authUser,
      {},
    );
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('agentId,agentName'),
    );
    expect(res.write).toHaveBeenCalledWith(expect.stringContaining('agent-1'));
    expect(res.end).toHaveBeenCalled();
  });
});
