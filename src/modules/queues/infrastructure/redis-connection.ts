import type { ConnectionOptions } from 'bullmq';

import { env } from '../../../config/env.js';

export function getQueueConnection(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}

export async function closeRedisConnection(): Promise<void> {
  // BullMQ manages its own connections per Queue/Worker instance.
}
