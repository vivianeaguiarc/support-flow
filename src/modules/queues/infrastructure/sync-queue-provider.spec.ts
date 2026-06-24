import { describe, expect, it, vi } from 'vitest';

import { EmailNotificationEvent } from '../../email/domain/email-notification-event.js';
import { ReportJobType } from '../../jobs/domain/job-types.js';
import { QueueName } from '../domain/queue-names.js';
import { SyncQueueProvider } from './sync-queue-provider.js';

vi.mock('../../workers/processors/email.processor.js', () => ({
  processEmailJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../workers/processors/webhook.processor.js', () => ({
  processWebhookJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../workers/processors/automation.processor.js', () => ({
  processAutomationJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../workers/processors/report.processor.js', () => ({
  processReportJob: vi.fn().mockResolvedValue({
    content: 'id,title\n1,Test\n',
    filename: 'tickets.csv',
  }),
}));

vi.mock('../../workers/processors/outbox.processor.js', () => ({
  processOutboxJob: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../workers/processors/outbox-relay.processor.js', () => ({
  processOutboxRelayJob: vi.fn().mockResolvedValue(undefined),
}));

describe('SyncQueueProvider', () => {
  it('should execute email jobs inline and track completed counts', async () => {
    const provider = new SyncQueueProvider();

    await provider.addEmailJob({
      event: EmailNotificationEvent.TICKET_CREATED,
      ticketId: 'ticket-1',
      tenantId: 'tenant-1',
      recipientId: 'user-1',
    });

    const overview = await provider.getJobsOverview();
    expect(overview[QueueName.EMAIL].completed).toBe(1);
    expect(overview[QueueName.EMAIL].waiting).toBe(0);
  });

  it('should return report job result via waitForReportJob', async () => {
    const provider = new SyncQueueProvider();

    const jobId = await provider.addReportJob({
      type: ReportJobType.TICKETS,
      tenantId: 'tenant-1',
      userId: 'admin-1',
      filters: {},
    });

    const result = await provider.waitForReportJob(jobId);
    expect(result.filename).toBe('tickets.csv');
    expect(result.content).toContain('id,title');
  });

  it('should move failed jobs to dead letter metrics', async () => {
    const { processWebhookJob } =
      await import('../../workers/processors/webhook.processor.js');
    vi.mocked(processWebhookJob).mockRejectedValueOnce(new Error('boom'));

    const provider = new SyncQueueProvider();

    await expect(
      provider.addWebhookJob({
        tenantId: 'tenant-1',
        event: 'ticket.created',
        data: {},
      }),
    ).rejects.toThrow('boom');

    const metrics = await provider.getQueueMetrics();
    const webhookMetrics = metrics.find(
      (metric) => metric.name === QueueName.WEBHOOK,
    );

    expect(webhookMetrics?.counts.failed).toBe(1);
    expect(webhookMetrics?.deadLetter.waiting).toBe(1);
  });
});
