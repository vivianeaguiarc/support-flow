import type { OutboxJobData } from '../../jobs/domain/job-types.js';
import { outboxRelayService } from '../../outbox/application/services/outbox-relay.service.js';

export async function processOutboxJob(data: OutboxJobData): Promise<void> {
  await outboxRelayService.processEvent(data.outboxEventId);
}
