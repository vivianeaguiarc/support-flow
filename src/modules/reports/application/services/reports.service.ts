import type { Response } from 'express';

import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { AnalyticsQueryDto } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import { ReportJobType } from '../../../jobs/domain/job-types.js';
import { queueProvider } from '../../../queues/queue-provider.js';

function setCsvDownloadHeaders(res: Response, filename: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

export class ReportsService {
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

    const jobId = await queueProvider.addReportJob({
      type: ReportJobType.TICKETS,
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    const result = await queueProvider.waitForReportJob(jobId);
    setCsvDownloadHeaders(res, result.filename);
    res.send(result.content);
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

    const jobId = await queueProvider.addReportJob({
      type: ReportJobType.AGENTS_PERFORMANCE,
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    const result = await queueProvider.waitForReportJob(jobId);
    setCsvDownloadHeaders(res, result.filename);
    res.send(result.content);
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

    const jobId = await queueProvider.addReportJob({
      type: ReportJobType.SLA,
      tenantId: authUser.tenantId,
      userId: authUser.id,
      filters: query,
    });

    const result = await queueProvider.waitForReportJob(jobId);
    setCsvDownloadHeaders(res, result.filename);
    res.send(result.content);
  }
}

export const reportsService = new ReportsService();
