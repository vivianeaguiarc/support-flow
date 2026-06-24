import { prisma } from '../../../../shared/database/prisma.js';
import type {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
} from '../../domain/webhook-endpoint.entity.js';
import type {
  WebhookEvent,
  WebhookPayload,
} from '../../domain/webhook-event.js';

type CreateWebhookEndpointInput = {
  tenantId: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  createdById: string;
};

type UpdateWebhookEndpointInput = {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  active?: boolean;
};

type CreateDeliveryInput = {
  tenantId: string;
  webhookEndpointId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
};

type UpdateDeliveryInput = {
  status: WebhookDeliveryStatus;
  responseStatus?: number | null;
  responseBody?: string | null;
  attemptCount: number;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
};

function parseEvents(events: unknown): WebhookEvent[] {
  if (!Array.isArray(events)) {
    return [];
  }

  return events.filter(
    (event): event is WebhookEvent => typeof event === 'string',
  );
}

function mapEndpoint(
  record: {
    id: string;
    tenantId: string;
    name: string;
    url: string;
    secret: string;
    active: boolean;
    events: unknown;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  },
  includeSecret = false,
): WebhookEndpoint | WebhookEndpointWithSecret {
  const base: WebhookEndpoint = {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    url: record.url,
    active: record.active,
    events: parseEvents(record.events),
    createdById: record.createdById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };

  if (includeSecret) {
    return { ...base, secret: record.secret };
  }

  return base;
}

function mapDelivery(record: {
  id: string;
  tenantId: string;
  webhookEndpointId: string;
  event: string;
  payload: unknown;
  status: WebhookDeliveryStatus;
  responseStatus: number | null;
  responseBody: string | null;
  attemptCount: number;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
}): WebhookDelivery {
  return {
    id: record.id,
    tenantId: record.tenantId,
    webhookEndpointId: record.webhookEndpointId,
    event: record.event as WebhookEvent,
    payload: record.payload as WebhookPayload,
    status: record.status,
    responseStatus: record.responseStatus,
    responseBody: record.responseBody,
    attemptCount: record.attemptCount,
    deliveredAt: record.deliveredAt,
    failedAt: record.failedAt,
    createdAt: record.createdAt,
  };
}

export class WebhooksRepository {
  async create(
    input: CreateWebhookEndpointInput,
  ): Promise<WebhookEndpointWithSecret> {
    const record = await prisma.webhookEndpoint.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        url: input.url,
        secret: input.secret,
        events: input.events,
        createdById: input.createdById,
      },
    });

    return mapEndpoint(record, true) as WebhookEndpointWithSecret;
  }

  async findAllByTenant(tenantId: string): Promise<WebhookEndpoint[]> {
    const records = await prisma.webhookEndpoint.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapEndpoint(record) as WebhookEndpoint);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<WebhookEndpoint | null> {
    const record = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    return record ? (mapEndpoint(record) as WebhookEndpoint) : null;
  }

  async findByIdWithSecret(
    tenantId: string,
    id: string,
  ): Promise<WebhookEndpointWithSecret | null> {
    const record = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    return record
      ? (mapEndpoint(record, true) as WebhookEndpointWithSecret)
      : null;
  }

  async findActiveByTenantAndEvent(
    tenantId: string,
    event: WebhookEvent,
  ): Promise<WebhookEndpointWithSecret[]> {
    const records = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        active: true,
      },
    });

    return records
      .filter((record) => parseEvents(record.events).includes(event))
      .map((record) => mapEndpoint(record, true) as WebhookEndpointWithSecret);
  }

  async update(
    tenantId: string,
    id: string,
    input: UpdateWebhookEndpointInput,
  ): Promise<WebhookEndpoint | null> {
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return null;
    }

    const record = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.events !== undefined ? { events: input.events } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    return mapEndpoint(record) as WebhookEndpoint;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return false;
    }

    await prisma.webhookEndpoint.delete({ where: { id } });
    return true;
  }

  async createDelivery(input: CreateDeliveryInput): Promise<WebhookDelivery> {
    const record = await prisma.webhookDelivery.create({
      data: {
        tenantId: input.tenantId,
        webhookEndpointId: input.webhookEndpointId,
        event: input.event,
        payload: input.payload as object,
      },
    });

    return mapDelivery(record);
  }

  async updateDelivery(
    id: string,
    input: UpdateDeliveryInput,
  ): Promise<WebhookDelivery> {
    const record = await prisma.webhookDelivery.update({
      where: { id },
      data: {
        status: input.status,
        responseStatus: input.responseStatus ?? null,
        responseBody: input.responseBody ?? null,
        attemptCount: input.attemptCount,
        deliveredAt: input.deliveredAt ?? null,
        failedAt: input.failedAt ?? null,
      },
    });

    return mapDelivery(record);
  }
}

export const webhooksRepository = new WebhooksRepository();
