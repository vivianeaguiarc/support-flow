import { randomUUID } from 'node:crypto';

import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import { queueProvider } from '../../../queues/queue-provider.js';
import type {
  WebhookDelivery,
  WebhookEndpointWithSecret,
} from '../../domain/webhook-endpoint.entity.js';
import { WebhookDeliveryStatus } from '../../domain/webhook-endpoint.entity.js';
import {
  WebhookEvent,
  type WebhookPayload,
} from '../../domain/webhook-event.js';
import {
  WebhooksRepository,
  webhooksRepository as defaultWebhooksRepository,
} from '../../infrastructure/repositories/webhooks.repository.js';
import { signWebhookPayload } from './webhook-signature.js';

const MAX_TEST_ATTEMPTS = 3;
const RETRY_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 10_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function truncateResponseBody(body: string, maxLength = 2000): string {
  if (body.length <= maxLength) {
    return body;
  }

  return `${body.slice(0, maxLength)}...`;
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

export class WebhookDispatcher {
  constructor(
    private readonly repository: WebhooksRepository = defaultWebhooksRepository,
  ) {}

  async dispatch(
    tenantId: string,
    event: WebhookEvent,
    data: Record<string, unknown>,
  ): Promise<void> {
    await queueProvider.addWebhookJob({
      tenantId,
      event,
      data,
    });
  }

  async dispatchDirect(
    tenantId: string,
    event: WebhookEvent,
    data: Record<string, unknown>,
  ): Promise<void> {
    const endpoints = await this.repository.findActiveByTenantAndEvent(
      tenantId,
      event,
    );

    if (endpoints.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      id: randomUUID(),
      event,
      createdAt: new Date().toISOString(),
      data,
    };

    for (const endpoint of endpoints) {
      const delivery = await this.deliverOnce(endpoint, payload);

      if (delivery.status === WebhookDeliveryStatus.FAILED) {
        throw new Error(
          `Webhook delivery failed for endpoint ${endpoint.id}: ${delivery.responseBody ?? 'unknown error'}`,
        );
      }
    }
  }

  async deliverTest(
    endpoint: WebhookEndpointWithSecret,
  ): Promise<WebhookDelivery> {
    const payload: WebhookPayload = {
      id: randomUUID(),
      event: WebhookEvent.TICKET_CREATED,
      createdAt: new Date().toISOString(),
      data: {
        test: true,
        message: 'SupportFlow webhook test delivery',
      },
    };

    let attemptCount = 0;
    let lastDelivery: WebhookDelivery | null = null;

    while (attemptCount < MAX_TEST_ATTEMPTS) {
      attemptCount += 1;
      lastDelivery = await this.deliverOnce(endpoint, payload);

      if (lastDelivery.status === WebhookDeliveryStatus.DELIVERED) {
        return lastDelivery;
      }

      const retryable =
        lastDelivery.responseStatus === null ||
        isRetryableStatus(lastDelivery.responseStatus);

      if (!retryable || attemptCount >= MAX_TEST_ATTEMPTS) {
        return lastDelivery;
      }

      await sleep(RETRY_DELAY_MS);
    }

    return lastDelivery!;
  }

  private async deliverOnce(
    endpoint: WebhookEndpointWithSecret,
    payload: WebhookPayload,
  ): Promise<WebhookDelivery> {
    const delivery = await this.repository.createDelivery({
      tenantId: endpoint.tenantId,
      webhookEndpointId: endpoint.id,
      event: payload.event,
      payload,
    });

    try {
      const body = JSON.stringify(payload);
      const signature = signWebhookPayload(endpoint.secret, body);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SupportFlow-Event': payload.event,
          'X-SupportFlow-Signature': signature,
          'X-SupportFlow-Delivery-Id': delivery.id,
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const responseBody = truncateResponseBody(await response.text());

      if (response.ok) {
        const updated = await this.repository.updateDelivery(delivery.id, {
          status: WebhookDeliveryStatus.DELIVERED,
          responseStatus: response.status,
          responseBody,
          attemptCount: 1,
          deliveredAt: new Date(),
          failedAt: null,
        });

        logBusinessEvent(BusinessEvent.WEBHOOK_DELIVERED, {
          tenantId: endpoint.tenantId,
          webhookEndpointId: endpoint.id,
          deliveryId: delivery.id,
          event: payload.event,
          attemptCount: 1,
        });

        return updated;
      }

      const failed = await this.repository.updateDelivery(delivery.id, {
        status: WebhookDeliveryStatus.FAILED,
        responseStatus: response.status,
        responseBody,
        attemptCount: 1,
        deliveredAt: null,
        failedAt: new Date(),
      });

      logBusinessEvent(BusinessEvent.WEBHOOK_DELIVERY_FAILED, {
        tenantId: endpoint.tenantId,
        webhookEndpointId: endpoint.id,
        deliveryId: delivery.id,
        event: payload.event,
        attemptCount: 1,
        responseStatus: response.status,
      });

      return failed;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown delivery error';

      const failed = await this.repository.updateDelivery(delivery.id, {
        status: WebhookDeliveryStatus.FAILED,
        responseStatus: null,
        responseBody: message,
        attemptCount: 1,
        deliveredAt: null,
        failedAt: new Date(),
      });

      logBusinessEvent(BusinessEvent.WEBHOOK_DELIVERY_FAILED, {
        tenantId: endpoint.tenantId,
        webhookEndpointId: endpoint.id,
        deliveryId: delivery.id,
        event: payload.event,
        attemptCount: 1,
        responseStatus: null,
      });

      return failed;
    }
  }
}

export const webhookDispatcher = new WebhookDispatcher();
