import { env } from '../../../config/env.js';

export function getDefaultJobOptions() {
  return {
    attempts: env.QUEUE_DEFAULT_ATTEMPTS,
    backoff: {
      type: 'exponential' as const,
      delay: env.QUEUE_BACKOFF_DELAY_MS,
    },
    removeOnComplete: {
      count: 1000,
    },
    removeOnFail: {
      count: 5000,
    },
  };
}
