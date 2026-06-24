import type { OutboxEvent, Prisma } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import type { DomainEvent } from '../../../../shared/events/domain-event.js';
import { OutboxEventStatus } from '../../domain/outbox-event-status.js';
import { serializeDomainEvent } from '../../domain/outbox-serializer.js';

export type OutboxListFilters = {
  status?: string;
  eventName?: string;
  page?: number;
  limit?: number;
};

export class OutboxRepository {
  async createFromDomainEvent(
    event: DomainEvent,
    tx?: Prisma.TransactionClient,
  ): Promise<OutboxEvent> {
    const client = tx ?? prisma;

    return client.outboxEvent.create({
      data: {
        id: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        payload: serializeDomainEvent(event) as Prisma.InputJsonValue,
        status: OutboxEventStatus.PENDING,
      },
    });
  }

  async createProcessedSideEffect(input: {
    eventName: string;
    aggregateId: string;
    payload: Record<string, unknown>;
  }): Promise<OutboxEvent> {
    return prisma.outboxEvent.create({
      data: {
        eventName: input.eventName,
        aggregateId: input.aggregateId,
        payload: input.payload as Prisma.InputJsonValue,
        status: OutboxEventStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  }

  async findPendingBatch(
    limit: number,
    maxAttempts: number,
  ): Promise<OutboxEvent[]> {
    return prisma.outboxEvent.findMany({
      where: {
        status: OutboxEventStatus.PENDING,
        attempts: { lt: maxAttempts },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async claimForProcessing(id: string): Promise<OutboxEvent | null> {
    const result = await prisma.outboxEvent.updateMany({
      where: {
        id,
        status: OutboxEventStatus.PENDING,
      },
      data: {
        status: OutboxEventStatus.PROCESSING,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return prisma.outboxEvent.findUnique({ where: { id } });
  }

  async markProcessed(id: string): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  }

  async markFailed(id: string, attempts: number): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.FAILED,
        attempts,
      },
    });
  }

  async markPendingForRetry(id: string, attempts: number): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: {
        status: OutboxEventStatus.PENDING,
        attempts,
      },
    });
  }

  async resetStuckProcessing(olderThan: Date): Promise<number> {
    const result = await prisma.outboxEvent.updateMany({
      where: {
        status: OutboxEventStatus.PROCESSING,
        createdAt: { lt: olderThan },
      },
      data: {
        status: OutboxEventStatus.PENDING,
      },
    });

    return result.count;
  }

  async list(filters: OutboxListFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const where = {
      ...(filters.status
        ? { status: filters.status as OutboxEvent['status'] }
        : {}),
      ...(filters.eventName ? { eventName: filters.eventName } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.outboxEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.outboxEvent.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async countByStatus(): Promise<Record<string, number>> {
    const groups = await prisma.outboxEvent.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return groups.reduce<Record<string, number>>(
      (acc: Record<string, number>, group) => {
        acc[group.status] = group._count._all;
        return acc;
      },
      {},
    );
  }

  async findById(id: string): Promise<OutboxEvent | null> {
    return prisma.outboxEvent.findUnique({ where: { id } });
  }
}

export const outboxRepository = new OutboxRepository();
