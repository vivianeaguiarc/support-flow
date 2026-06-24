import { type Job, Queue, QueueEvents, Worker } from 'bullmq';

import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';
import type {
  AutomationJobData,
  DeadLetterJobData,
  EmailJobData,
  ReportJobData,
  ReportJobResult,
  WebhookJobData,
} from '../../jobs/domain/job-types.js';
import { runJobWithTracing } from '../../observability/infrastructure/job-tracing.js';
import { processAutomationJob } from '../../workers/processors/automation.processor.js';
import { processEmailJob } from '../../workers/processors/email.processor.js';
import { processReportJob } from '../../workers/processors/report.processor.js';
import { processWebhookJob } from '../../workers/processors/webhook.processor.js';
import { getDefaultJobOptions } from '../domain/queue-job-options.js';
import {
  ALL_QUEUE_NAMES,
  DeadLetterQueueName,
  QueueName,
  toDeadLetterQueueName,
} from '../domain/queue-names.js';
import type {
  QueueJobsOverview,
  QueueMetrics,
  QueueProvider,
} from '../domain/queue-provider.interface.js';
import { getQueueConnection } from './redis-connection.js';

type ManagedQueue = {
  queue: Queue;
  events: QueueEvents;
  deadLetterQueue: Queue;
};

function mapJobCounts(counts: {
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
  delayed?: number;
}) {
  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
  };
}

export class BullMQQueueProvider implements QueueProvider {
  private readonly managedQueues = new Map<QueueName, ManagedQueue>();
  private workers: Worker[] = [];
  private started = false;

  constructor() {
    for (const queueName of ALL_QUEUE_NAMES) {
      const connection = getQueueConnection();
      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: getDefaultJobOptions(),
      });
      const events = new QueueEvents(queueName, { connection });
      const deadLetterQueue = new Queue(toDeadLetterQueueName(queueName), {
        connection,
        defaultJobOptions: {
          removeOnComplete: { count: 5000 },
          removeOnFail: { count: 5000 },
        },
      });

      this.managedQueues.set(queueName, {
        queue,
        events,
        deadLetterQueue,
      });
    }
  }

  isEnabled(): boolean {
    return true;
  }

  async addEmailJob(data: EmailJobData): Promise<string> {
    const job = await this.getQueue(QueueName.EMAIL).add('send-email', data);
    return String(job.id);
  }

  async addWebhookJob(data: WebhookJobData): Promise<string> {
    const job = await this.getQueue(QueueName.WEBHOOK).add(
      'dispatch-webhook',
      data,
    );
    return String(job.id);
  }

  async addReportJob(data: ReportJobData): Promise<string> {
    const job = await this.getQueue(QueueName.REPORT).add(
      'generate-report',
      data,
    );
    return String(job.id);
  }

  async addAutomationJob(data: AutomationJobData): Promise<string> {
    const job = await this.getQueue(QueueName.AUTOMATION).add(
      'process-automation',
      data,
    );
    return String(job.id);
  }

  async waitForReportJob(jobId: string): Promise<ReportJobResult> {
    const managed = this.managedQueues.get(QueueName.REPORT);
    if (!managed) {
      throw new Error('Report queue is not configured');
    }

    const job = await managed.queue.getJob(jobId);
    if (!job) {
      throw new Error(`Report job ${jobId} not found`);
    }

    const result = await job.waitUntilFinished(
      managed.events,
      env.QUEUE_JOB_TIMEOUT_MS,
    );

    return result as ReportJobResult;
  }

  async getJobsOverview(): Promise<QueueJobsOverview> {
    const overview = {} as QueueJobsOverview;

    for (const queueName of ALL_QUEUE_NAMES) {
      const counts = await this.getQueue(queueName).getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
      );
      overview[queueName] = {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
      };
    }

    return overview;
  }

  async getQueueMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];

    for (const queueName of ALL_QUEUE_NAMES) {
      const counts = mapJobCounts(
        await this.getQueue(queueName).getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        ),
      );
      const deadLetterCounts = mapJobCounts(
        await this.getDeadLetterQueue(queueName).getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        ),
      );

      metrics.push({
        name: queueName,
        counts,
        deadLetter: deadLetterCounts,
      });
    }

    return metrics;
  }

  async startWorkers(): Promise<void> {
    if (this.started) {
      return;
    }

    const connection = getQueueConnection();
    const defaultOptions = getDefaultJobOptions();

    this.workers.push(
      this.createWorker(
        QueueName.EMAIL,
        processEmailJob,
        connection,
        defaultOptions,
      ),
      this.createWorker(
        QueueName.WEBHOOK,
        processWebhookJob,
        connection,
        defaultOptions,
      ),
      this.createWorker(
        QueueName.REPORT,
        processReportJob,
        connection,
        defaultOptions,
      ),
      this.createWorker(
        QueueName.AUTOMATION,
        processAutomationJob,
        connection,
        defaultOptions,
      ),
    );

    this.started = true;
    logger.info({ queues: ALL_QUEUE_NAMES }, 'queue.workers.started');
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    this.workers = [];

    await Promise.all(
      [...this.managedQueues.values()].flatMap((managed) => [
        managed.queue.close(),
        managed.events.close(),
        managed.deadLetterQueue.close(),
      ]),
    );

    this.managedQueues.clear();
    this.started = false;
  }

  private getQueue(queueName: QueueName): Queue {
    const managed = this.managedQueues.get(queueName);
    if (!managed) {
      throw new Error(`Queue ${queueName} is not configured`);
    }

    return managed.queue;
  }

  private getDeadLetterQueue(queueName: QueueName): Queue {
    const managed = this.managedQueues.get(queueName);
    if (!managed) {
      throw new Error(`Queue ${queueName} is not configured`);
    }

    return managed.deadLetterQueue;
  }

  private createWorker<T>(
    queueName: QueueName,
    processor: (data: T) => Promise<unknown>,
    connection: ReturnType<typeof getQueueConnection>,
    defaultJobOptions: ReturnType<typeof getDefaultJobOptions>,
  ): Worker<T> {
    const worker = new Worker<T>(
      queueName,
      async (job: Job<T>) =>
        runJobWithTracing(queueName, String(job.id), () => processor(job.data)),
      {
        connection,
        concurrency: env.QUEUE_WORKER_CONCURRENCY,
      },
    );

    worker.on('failed', async (job, error) => {
      if (!job) {
        return;
      }

      const maxAttempts = job.opts.attempts ?? defaultJobOptions.attempts;
      if (job.attemptsMade < maxAttempts) {
        return;
      }

      const deadLetterPayload: DeadLetterJobData = {
        originalQueue: queueName,
        originalJobId: String(job.id),
        data: job.data,
        error: error.message,
        failedAt: new Date().toISOString(),
      };

      await this.getDeadLetterQueue(queueName).add(
        'dead-letter',
        deadLetterPayload,
      );

      logger.error(
        {
          err: error,
          queue: queueName,
          jobId: job.id,
          attemptsMade: job.attemptsMade,
          deadLetterQueue: toDeadLetterQueueName(
            queueName,
          ) as DeadLetterQueueName,
        },
        'queue.job.dead_lettered',
      );
    });

    return worker;
  }
}
