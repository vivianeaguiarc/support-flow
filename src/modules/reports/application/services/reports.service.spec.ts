import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../../../../shared/types/user-role.js';
import { ReportJobType } from '../../../jobs/domain/job-types.js';
import { ReportsService } from './reports.service.js';

const { addReportJobMock, waitForReportJobMock } = vi.hoisted(() => ({
  addReportJobMock: vi.fn(),
  waitForReportJobMock: vi.fn(),
}));

vi.mock('../../../queues/queue-provider.js', () => ({
  queueProvider: {
    addReportJob: addReportJobMock,
    waitForReportJob: waitForReportJobMock,
  },
}));

describe('ReportsService', () => {
  const authUser = {
    id: 'admin-1',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    tenantId: 'tenant-1',
  };

  const createResponse = () => {
    const res = {
      setHeader: vi.fn(),
      send: vi.fn(),
    } as unknown as Response;

    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    addReportJobMock.mockResolvedValue('job-1');
  });

  it('should enqueue tickets report and send csv response', async () => {
    waitForReportJobMock.mockResolvedValue({
      content: 'protocol,title\nTK-001,Title\n',
      filename: 'tickets.csv',
    });

    const res = createResponse();
    const service = new ReportsService();

    await service.exportTicketsCsv(authUser, {}, res);

    expect(addReportJobMock).toHaveBeenCalledWith({
      type: ReportJobType.TICKETS,
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: {},
    });
    expect(waitForReportJobMock).toHaveBeenCalledWith('job-1');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'text/csv; charset=utf-8',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="tickets.csv"',
    );
    expect(res.send).toHaveBeenCalledWith('protocol,title\nTK-001,Title\n');
  });

  it('should enqueue agents performance report job', async () => {
    waitForReportJobMock.mockResolvedValue({
      content: 'agentId,agentName\nagent-1,Agent 1\n',
      filename: 'agents-performance.csv',
    });

    const res = createResponse();
    const service = new ReportsService();

    await service.exportAgentsPerformanceCsv(authUser, {}, res);

    expect(addReportJobMock).toHaveBeenCalledWith({
      type: ReportJobType.AGENTS_PERFORMANCE,
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: {},
    });
    expect(res.send).toHaveBeenCalledWith(
      'agentId,agentName\nagent-1,Agent 1\n',
    );
  });
});
