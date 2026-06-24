export const OutboxEventStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

export type OutboxEventStatusValue =
  (typeof OutboxEventStatus)[keyof typeof OutboxEventStatus];
