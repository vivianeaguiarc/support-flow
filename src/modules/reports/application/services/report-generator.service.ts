import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import {
  AnalyticsService,
  analyticsService as defaultAnalyticsService,
} from '../../../analytics/application/services/analytics.service.js';
import type { AnalyticsQueryDto } from '../../../analytics/presentation/dtos/analytics-query.dto.js';
import {
  type ReportJobResult,
  ReportJobType,
} from '../../../jobs/domain/job-types.js';
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

export class ReportGeneratorService {
  constructor(
    private readonly reportsRepo: ReportsRepository = defaultReportsRepository,
    private readonly analyticsService: AnalyticsService = defaultAnalyticsService,
  ) {}

  async generate(
    type: ReportJobType,
    tenantId: string,
    userId: string,
    filters: AnalyticsQueryDto,
  ): Promise<ReportJobResult> {
    switch (type) {
      case ReportJobType.TICKETS:
        return {
          content: await this.generateTicketsCsv(tenantId, filters),
          filename: 'tickets.csv',
        };
      case ReportJobType.AGENTS_PERFORMANCE:
        return {
          content: await this.generateAgentsPerformanceCsv(
            tenantId,
            userId,
            filters,
          ),
          filename: 'agents-performance.csv',
        };
      case ReportJobType.SLA:
        return {
          content: await this.generateSlaCsv(tenantId, filters),
          filename: 'sla.csv',
        };
      default:
        throw new Error(`Unsupported report type: ${type as string}`);
    }
  }

  async persistReport(
    tenantId: string,
    jobId: string,
    result: ReportJobResult,
  ): Promise<string> {
    const directory = path.join(process.cwd(), 'storage', 'reports', tenantId);
    await mkdir(directory, { recursive: true });
    const filePath = path.join(directory, `${jobId}-${result.filename}`);
    await writeFile(filePath, result.content, 'utf8');
    return filePath;
  }

  private buildAuthUser(tenantId: string, userId: string): AuthenticatedUser {
    return {
      id: userId,
      email: 'report-worker@supportflow.internal',
      role: UserRole.ADMIN,
      tenantId,
    };
  }

  private async generateTicketsCsv(
    tenantId: string,
    filters: AnalyticsQueryDto,
  ): Promise<string> {
    const lines = [this.reportsRepo.getTicketCsvHeaders()];

    for await (const row of this.reportsRepo.streamTicketRows({
      tenantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      priority: filters.priority,
      agentId: filters.agentId,
    })) {
      lines.push(this.reportsRepo.formatTicketCsvRow(row));
    }

    return `${lines.join('\n')}\n`;
  }

  private async generateAgentsPerformanceCsv(
    tenantId: string,
    userId: string,
    filters: AnalyticsQueryDto,
  ): Promise<string> {
    const data = await this.analyticsService.getAgentsPerformance(
      this.buildAuthUser(tenantId, userId),
      filters,
    );

    const lines = [AGENTS_PERFORMANCE_CSV_HEADERS.join(',')];

    for (const agent of data.agents) {
      lines.push(
        formatCsvRow([
          agent.agentId,
          agent.agentName,
          agent.assignedTickets,
          agent.resolvedTickets,
          agent.openTickets,
          agent.slaBreachedTickets,
          agent.avgResolutionTimeHours,
        ]),
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private async generateSlaCsv(
    tenantId: string,
    filters: AnalyticsQueryDto,
  ): Promise<string> {
    const lines = [this.reportsRepo.getSlaCsvHeaders()];

    for await (const row of this.reportsRepo.streamSlaRows({
      tenantId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      priority: filters.priority,
      agentId: filters.agentId,
    })) {
      lines.push(this.reportsRepo.formatSlaCsvRow(row));
    }

    return `${lines.join('\n')}\n`;
  }
}

export const reportGeneratorService = new ReportGeneratorService();
