import { randomUUID } from 'node:crypto';

import { logger } from '../../../shared/logger/logger.js';
import type {
  AutomationJobData,
  EmailJobData,
  OutboxDeadLetterJobData,
  OutboxJobData,
  OutboxRelayJobData,
  ReportJobData,
  ReportJobResult,
  WebhookJobData,
} from '../../jobs/domain/job-types.js';
import { runJobWithTracing } from '../../observability/infrastructure/job-tracing.js';
import { processAutomationJob } from '../../workers/processors/automation.processor.js';
import { processEmailJob } from '../../workers/processors/email.processor.js';
import { processOutboxJob } from '../../workers/processors/outbox.processor.js';
import { processOutboxRelayJob } from '../../workers/processors/outbox-relay.processor.js';
import { processReportJob } from '../../workers/processors/report.processor.js';
import { processWebhookJob } from '../../workers/processors/webhook.processor.js';
import {
  ALL_QUEUE_NAMES,
  QueueName,
  toDeadLetterQueueName,
} from '../domain/queue-names.js';
import type {
  QueueJobsOverview,
  QueueMetrics,
  QueueProvider,
} from '../domain/queue-provider.interface.js';

type SyncJobRecord = {
  id: string;
  queue: QueueName;
  data: unknown;
  status: 'waiting' | 'active' | 'completed' | 'failed';
};

function emptyCounts() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  };
}

export class SyncQueueProvider implements QueueProvider {
  private readonly jobs = new Map<string, SyncJobRecord>();
  private readonly deadLetterJobs: SyncJobRecord[] = [];
  private readonly counts: Record<QueueName, ReturnType<typeof emptyCounts>> = {
    [QueueName.EMAIL]: emptyCounts(),
    [QueueName.WEBHOOK]: emptyCounts(),
    [QueueName.REPORT]: emptyCounts(),
    [QueueName.AUTOMATION]: emptyCounts(),
    [QueueName.OUTBOX]: emptyCounts(),
  };

  isEnabled(): boolean {
    return false;
  }

  async addEmailJob(data: EmailJobData): Promise<string> {
    return this.enqueue(QueueName.EMAIL, data, processEmailJob);
  }

  async addWebhookJob(data: WebhookJobData): Promise<string> {
    return this.enqueue(QueueName.WEBHOOK, data, processWebhookJob);
  }

  async addReportJob(data: ReportJobData): Promise<string> {
    return this.enqueue(QueueName.REPORT, data, processReportJob);
  }

  async addAutomationJob(data: AutomationJobData): Promise<string> {
    return this.enqueue(QueueName.AUTOMATION, data, processAutomationJob);
  }

  async addOutboxJob(data: OutboxJobData): Promise<string> {
    return this.enqueue(QueueName.OUTBOX, data, processOutboxJob);
  }

  async addOutboxRelayJob(): Promise<string> {
    return this.enqueue(
      QueueName.OUTBOX,
      { triggeredAt: new Date().toISOString() } satisfies OutboxRelayJobData,
      processOutboxRelayJob,
    );
  }

  async addOutboxDeadLetterJob(data: OutboxDeadLetterJobData): Promise<string> {
    const jobId = randomUUID();
    this.deadLetterJobs.push({
      id: jobId,
      queue: QueueName.OUTBOX,
      data,
      status: 'failed',
    });

    this.counts[QueueName.OUTBOX].failed += 1;
    return jobId;
  }

  async waitForReportJob(jobId: string): Promise<ReportJobResult> {
    const job = this.jobs.get(jobId);
    if (!job || job.queue !== QueueName.REPORT) {
      throw new Error(`Report job ${jobId} not found`);
    }

    if (job.status === 'failed') {
      throw new Error(`Report job ${jobId} failed`);
    }

    return job.data as ReportJobResult;
  }

  async getJobsOverview(): Promise<QueueJobsOverview> {
    return {
      [QueueName.EMAIL]: this.pickOverview(QueueName.EMAIL),
      [QueueName.WEBHOOK]: this.pickOverview(QueueName.WEBHOOK),
      [QueueName.REPORT]: this.pickOverview(QueueName.REPORT),
      [QueueName.AUTOMATION]: this.pickOverview(QueueName.AUTOMATION),
      [QueueName.OUTBOX]: this.pickOverview(QueueName.OUTBOX),
    };
  }

  async getQueueMetrics(): Promise<QueueMetrics[]> {
    return ALL_QUEUE_NAMES.map((name) => ({
      name,
      counts: { ...this.counts[name] },
      deadLetter: {
        waiting: this.deadLetterJobs.filter((job) => job.queue === name).length,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      },
    }));
  }

  async startWorkers(): Promise<void> {
    // Sync provider executes jobs inline — no background workers.
  }

  async close(): Promise<void> {
    this.jobs.clear();
    this.deadLetterJobs.length = 0;
  }

  private pickOverview(queue: QueueName) {
    const counts = this.counts[queue];
    return {
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
    };
  }

  private async enqueue<T>(
    queue: QueueName,
    data: T,
    processor: (payload: T) => Promise<unknown>,
  ): Promise<string> {
    const jobId = randomUUID();
    const record: SyncJobRecord = {
      id: jobId,
      queue,
      data,
      status: 'waiting',
    };

    this.jobs.set(jobId, record);
    this.counts[queue].waiting += 1;

    try {
      record.status = 'active';
      this.counts[queue].waiting -= 1;
      this.counts[queue].active += 1;

      const result = await runJobWithTracing(queue, jobId, () =>
        processor(data),
      );

      record.status = 'completed';
      this.counts[queue].active -= 1;
      this.counts[queue].completed += 1;

      if (queue === QueueName.REPORT) {
        this.jobs.set(jobId, {
          ...record,
          data: result,
        });
      }
    } catch (error) {
      record.status = 'failed';
      this.counts[queue].active -= 1;
      this.counts[queue].failed += 1;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.deadLetterJobs.push({
        id: randomUUID(),
        queue,
        data: {
          originalQueue: queue,
          originalJobId: jobId,
          data,
          error: message,
          failedAt: new Date().toISOString(),
        },
        status: 'failed',
      });

      logger.error(
        {
          err: error,
          queue,
          jobId,
          deadLetterQueue: toDeadLetterQueueName(queue),
        },
        'queue.job.failed',
      );

      throw error;
    }

    return jobId;
  }
}
