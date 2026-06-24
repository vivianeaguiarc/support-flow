import { ALL_QUEUE_NAMES } from '../../queues/domain/queue-names.js';
import type {
  QueueJobCounts,
  QueueJobsOverview,
  QueueMetrics,
} from '../../queues/domain/queue-provider.interface.js';
import { queueProvider } from '../../queues/queue-provider.js';

export type JobsOverviewResponse = {
  queues: QueueJobsOverview;
  totals: Pick<QueueJobCounts, 'waiting' | 'active' | 'completed' | 'failed'>;
};

export type JobsMetricsResponse = {
  queues: QueueMetrics[];
  generatedAt: string;
};

export class JobsMonitorService {
  async getOverview(): Promise<JobsOverviewResponse> {
    const queues = await queueProvider.getJobsOverview();

    const totals = ALL_QUEUE_NAMES.reduce(
      (accumulator, queueName) => {
        const counts = queues[queueName];
        return {
          waiting: accumulator.waiting + counts.waiting,
          active: accumulator.active + counts.active,
          completed: accumulator.completed + counts.completed,
          failed: accumulator.failed + counts.failed,
        };
      },
      { waiting: 0, active: 0, completed: 0, failed: 0 },
    );

    return { queues, totals };
  }

  async getMetrics(): Promise<JobsMetricsResponse> {
    const queues = await queueProvider.getQueueMetrics();

    return {
      queues,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const jobsMonitorService = new JobsMonitorService();
