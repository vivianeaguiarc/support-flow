import type { OutboxEvent } from '@prisma/client';

import {
  OutboxRepository,
  outboxRepository as defaultOutboxRepository,
} from '../../infrastructure/repositories/outbox.repository.js';

export class OutboxAdminService {
  constructor(
    private readonly repository: OutboxRepository = defaultOutboxRepository,
  ) {}

  async list(input: {
    status?: string;
    eventName?: string;
    page?: number;
    limit?: number;
  }) {
    const result = await this.repository.list(input);

    return {
      data: result.data.map((event: OutboxEvent) => ({
        id: event.id,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        status: event.status,
        attempts: event.attempts,
        createdAt: event.createdAt.toISOString(),
        processedAt: event.processedAt?.toISOString() ?? null,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async metrics() {
    const byStatus = await this.repository.countByStatus();

    return {
      pending: byStatus.PENDING ?? 0,
      processing: byStatus.PROCESSING ?? 0,
      processed: byStatus.PROCESSED ?? 0,
      failed: byStatus.FAILED ?? 0,
      total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    };
  }
}

export const outboxAdminService = new OutboxAdminService();
