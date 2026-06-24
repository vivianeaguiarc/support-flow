import type { WebhookJobData } from '../../jobs/domain/job-types.js';
import { webhookDispatcher } from '../../webhooks/application/services/webhook-dispatcher.js';

export async function processWebhookJob(data: WebhookJobData): Promise<void> {
  await webhookDispatcher.dispatchDirect(data.tenantId, data.event, data.data);
}
