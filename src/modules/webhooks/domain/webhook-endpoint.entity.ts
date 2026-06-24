import type { WebhookEvent, WebhookPayload } from './webhook-event.js';

export type WebhookEndpoint = {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  active: boolean;
  events: WebhookEvent[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WebhookEndpointWithSecret = WebhookEndpoint & {
  secret: string;
};

export const WebhookDeliveryStatus = {
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export type WebhookDeliveryStatus =
  (typeof WebhookDeliveryStatus)[keyof typeof WebhookDeliveryStatus];

export type WebhookDelivery = {
  id: string;
  tenantId: string;
  webhookEndpointId: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  status: WebhookDeliveryStatus;
  responseStatus: number | null;
  responseBody: string | null;
  attemptCount: number;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
};

export function maskWebhookSecret(secret: string): string {
  if (secret.length <= 8) {
    return '********';
  }

  return `${secret.slice(0, 8)}...`;
}
