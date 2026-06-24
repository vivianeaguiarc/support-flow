import { outboxRelayService } from '../../outbox/application/services/outbox-relay.service.js';

export async function processOutboxRelayJob(): Promise<void> {
  await outboxRelayService.relayPendingBatch();
}
