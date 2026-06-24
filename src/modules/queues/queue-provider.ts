import { env } from '../../config/env.js';
import type { QueueProvider } from './domain/queue-provider.interface.js';
import { BullMQQueueProvider } from './infrastructure/bullmq-queue-provider.js';
import { SyncQueueProvider } from './infrastructure/sync-queue-provider.js';

let queueProviderInstance: QueueProvider | null = null;

export function getQueueProvider(): QueueProvider {
  if (!queueProviderInstance) {
    queueProviderInstance = env.QUEUE_ENABLED
      ? new BullMQQueueProvider()
      : new SyncQueueProvider();
  }

  return queueProviderInstance;
}

export async function closeQueueProvider(): Promise<void> {
  if (queueProviderInstance) {
    await queueProviderInstance.close();
    queueProviderInstance = null;
  }
}

export const queueProvider = getQueueProvider();
