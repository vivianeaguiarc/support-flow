import { randomUUID } from 'node:crypto';

import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
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

const MAX_ATTEMPTS = 3;
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

    await Promise.all(
      endpoints.map((endpoint) => this.deliverToEndpoint(endpoint, payload)),
    );
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

    return this.deliverToEndpoint(endpoint, payload);
  }

  private async deliverToEndpoint(
    endpoint: WebhookEndpointWithSecret,
    payload: WebhookPayload,
  ): Promise<WebhookDelivery> {
    const delivery = await this.repository.createDelivery({
      tenantId: endpoint.tenantId,
      webhookEndpointId: endpoint.id,
      event: payload.event,
      payload,
    });

    let attemptCount = 0;
    let lastResponseStatus: number | null = null;
    let lastResponseBody: string | null = null;

    while (attemptCount < MAX_ATTEMPTS) {
      attemptCount += 1;

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

        lastResponseStatus = response.status;
        lastResponseBody = truncateResponseBody(await response.text());

        if (response.ok) {
          const updated = await this.repository.updateDelivery(delivery.id, {
            status: WebhookDeliveryStatus.DELIVERED,
            responseStatus: lastResponseStatus,
            responseBody: lastResponseBody,
            attemptCount,
            deliveredAt: new Date(),
            failedAt: null,
          });

          logBusinessEvent(BusinessEvent.WEBHOOK_DELIVERED, {
            tenantId: endpoint.tenantId,
            webhookEndpointId: endpoint.id,
            deliveryId: delivery.id,
            event: payload.event,
            attemptCount,
          });

          return updated;
        }

        if (
          !isRetryableStatus(response.status) ||
          attemptCount >= MAX_ATTEMPTS
        ) {
          break;
        }
      } catch (error) {
        lastResponseStatus = null;
        lastResponseBody =
          error instanceof Error ? error.message : 'Unknown delivery error';

        if (attemptCount >= MAX_ATTEMPTS) {
          break;
        }
      }

      if (attemptCount < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
      }
    }

    const failed = await this.repository.updateDelivery(delivery.id, {
      status: WebhookDeliveryStatus.FAILED,
      responseStatus: lastResponseStatus,
      responseBody: lastResponseBody,
      attemptCount,
      deliveredAt: null,
      failedAt: new Date(),
    });

    logBusinessEvent(BusinessEvent.WEBHOOK_DELIVERY_FAILED, {
      tenantId: endpoint.tenantId,
      webhookEndpointId: endpoint.id,
      deliveryId: delivery.id,
      event: payload.event,
      attemptCount,
      responseStatus: lastResponseStatus,
    });

    return failed;
  }
}

export const webhookDispatcher = new WebhookDispatcher();
