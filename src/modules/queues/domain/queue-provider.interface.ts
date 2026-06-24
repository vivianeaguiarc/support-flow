import type {
  AutomationJobData,
  EmailJobData,
  ReportJobData,
  ReportJobResult,
  WebhookJobData,
} from '../../jobs/domain/job-types.js';
import type { QueueName } from './queue-names.js';

export type QueueJobCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export type QueueMetrics = {
  name: QueueName;
  counts: QueueJobCounts;
  deadLetter: QueueJobCounts;
};

export type QueueJobsOverview = Record<
  QueueName,
  Pick<QueueJobCounts, 'waiting' | 'active' | 'completed' | 'failed'>
>;

export interface QueueProvider {
  isEnabled(): boolean;
  addEmailJob(data: EmailJobData): Promise<string>;
  addWebhookJob(data: WebhookJobData): Promise<string>;
  addReportJob(data: ReportJobData): Promise<string>;
  addAutomationJob(data: AutomationJobData): Promise<string>;
  waitForReportJob(jobId: string): Promise<ReportJobResult>;
  getJobsOverview(): Promise<QueueJobsOverview>;
  getQueueMetrics(): Promise<QueueMetrics[]>;
  startWorkers(): Promise<void>;
  close(): Promise<void>;
}
