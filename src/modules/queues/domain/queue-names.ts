export const QueueName = {
  EMAIL: 'email-queue',
  WEBHOOK: 'webhook-queue',
  REPORT: 'report-queue',
  AUTOMATION: 'automation-queue',
  OUTBOX: 'outbox-queue',
} as const;

export type QueueName = (typeof QueueName)[keyof typeof QueueName];

export const DeadLetterQueueName = {
  EMAIL: 'email-queue-dlq',
  WEBHOOK: 'webhook-queue-dlq',
  REPORT: 'report-queue-dlq',
  AUTOMATION: 'automation-queue-dlq',
  OUTBOX: 'outbox-queue-dlq',
} as const;

export type DeadLetterQueueName =
  (typeof DeadLetterQueueName)[keyof typeof DeadLetterQueueName];

export const ALL_QUEUE_NAMES = Object.values(QueueName);
export const ALL_DEAD_LETTER_QUEUE_NAMES = Object.values(DeadLetterQueueName);

export function toDeadLetterQueueName(
  queueName: QueueName,
): DeadLetterQueueName {
  return `${queueName}-dlq` as DeadLetterQueueName;
}
