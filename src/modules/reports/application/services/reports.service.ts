import type { Response } from 'express';

import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import {
  AnalyticsService,
  analyticsService as defaultAnalyticsService,
} from '../../../analytics/application/services/analytics.service.js';
import type { AnalyticsQueryDto } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import { formatCsvRow } from '../../infrastructure/csv/csv-formatter.js';
import {
  ReportsRepository,
  reportsRepository as defaultReportsRepository,
} from '../../infrastructure/repositories/reports.repository.js';

const AGENTS_PERFORMANCE_CSV_HEADERS = [
  'agentId',
  'agentName',
  'assignedTickets',
  'resolvedTickets',
  'openTickets',
  'slaBreachedTickets',
  'avgResolutionTimeHours',
] as const;

function setCsvDownloadHeaders(res: Response, filename: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

export class ReportsService {
  constructor(
    private readonly reportsRepo: ReportsRepository = defaultReportsRepository,
    private readonly analyticsService: AnalyticsService = defaultAnalyticsService,
  ) {}

  async exportTicketsCsv(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
    res: Response,
  ): Promise<void> {
    logBusinessEvent(BusinessEvent.REPORT_TICKETS_EXPORTED, {
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    setCsvDownloadHeaders(res, 'tickets.csv');
    res.write(`${this.reportsRepo.getTicketCsvHeaders()}\n`);

    for await (const row of this.reportsRepo.streamTicketRows({
      tenantId: authUser.tenantId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
      priority: query.priority,
      agentId: query.agentId,
    })) {
      res.write(`${this.reportsRepo.formatTicketCsvRow(row)}\n`);
    }

    res.end();
  }

  async exportAgentsPerformanceCsv(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
    res: Response,
  ): Promise<void> {
    logBusinessEvent(BusinessEvent.REPORT_AGENTS_PERFORMANCE_EXPORTED, {
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    const data = await this.analyticsService.getAgentsPerformance(
      authUser,
      query,
    );

    setCsvDownloadHeaders(res, 'agents-performance.csv');
    res.write(`${AGENTS_PERFORMANCE_CSV_HEADERS.join(',')}\n`);

    for (const agent of data.agents) {
      res.write(
        `${formatCsvRow([
          agent.agentId,
          agent.agentName,
          agent.assignedTickets,
          agent.resolvedTickets,
          agent.openTickets,
          agent.slaBreachedTickets,
          agent.avgResolutionTimeHours,
        ])}\n`,
      );
    }

    res.end();
  }

  async exportSlaCsv(
    authUser: AuthenticatedUser,
    query: AnalyticsQueryDto,
    res: Response,
  ): Promise<void> {
    logBusinessEvent(BusinessEvent.REPORT_SLA_EXPORTED, {
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    setCsvDownloadHeaders(res, 'sla.csv');
    res.write(`${this.reportsRepo.getSlaCsvHeaders()}\n`);

    for await (const row of this.reportsRepo.streamSlaRows({
      tenantId: authUser.tenantId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
      priority: query.priority,
      agentId: query.agentId,
    })) {
      res.write(`${this.reportsRepo.formatSlaCsvRow(row)}\n`);
    }

    res.end();
  }
}

export const reportsService = new ReportsService();
