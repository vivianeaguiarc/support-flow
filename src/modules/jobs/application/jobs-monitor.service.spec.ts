import { describe, expect, it, vi } from 'vitest';

import { QueueName } from '../../queues/domain/queue-names.js';
import { jobsMonitorService } from './jobs-monitor.service.js';

vi.mock('../../queues/queue-provider.js', () => ({
  queueProvider: {
    getJobsOverview: vi.fn().mockResolvedValue({
      [QueueName.EMAIL]: {
        waiting: 1,
        active: 0,
        completed: 10,
        failed: 0,
      },
      [QueueName.WEBHOOK]: {
        waiting: 0,
        active: 1,
        completed: 5,
        failed: 1,
      },
      [QueueName.REPORT]: {
        waiting: 0,
        active: 0,
        completed: 2,
        failed: 0,
      },
      [QueueName.AUTOMATION]: {
        waiting: 0,
        active: 0,
        completed: 3,
        failed: 0,
      },
    }),
    getQueueMetrics: vi.fn().mockResolvedValue([
      {
        name: QueueName.EMAIL,
        counts: {
          waiting: 1,
          active: 0,
          completed: 10,
          failed: 0,
          delayed: 0,
        },
        deadLetter: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
      },
    ]),
  },
}));

describe('JobsMonitorService', () => {
  it('should aggregate queue overview totals', async () => {
    const overview = await jobsMonitorService.getOverview();

    expect(overview.totals).toEqual({
      waiting: 1,
      active: 1,
      completed: 20,
      failed: 1,
    });
    expect(overview.queues[QueueName.EMAIL].completed).toBe(10);
  });

  it('should return queue metrics with generatedAt', async () => {
    const metrics = await jobsMonitorService.getMetrics();

    expect(metrics.queues).toHaveLength(1);
    expect(metrics.generatedAt).toBeTruthy();
  });
});
