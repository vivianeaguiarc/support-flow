import type {
  ReportJobData,
  ReportJobResult,
} from '../../jobs/domain/job-types.js';
import { reportGeneratorService } from '../../reports/application/services/report-generator.service.js';

export async function processReportJob(
  data: ReportJobData,
): Promise<ReportJobResult> {
  return reportGeneratorService.generate(
    data.type,
    data.tenantId,
    data.userId,
    data.filters,
  );
}
