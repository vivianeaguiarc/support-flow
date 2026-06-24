import { afterEach, describe, expect, it, vi } from 'vitest';

import { WebhookDeliveryStatus } from '../../domain/webhook-endpoint.entity.js';
import { WebhookEvent } from '../../domain/webhook-event.js';
import { WebhookDispatcher } from './webhook-dispatcher.js';

describe('WebhookDispatcher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should deliver webhook with HMAC headers on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    });
    vi.stubGlobal('fetch', fetchMock);

    const repository = {
      findActiveByTenantAndEvent: vi.fn().mockResolvedValue([
        {
          id: 'endpoint-1',
          tenantId: 'tenant-1',
          name: 'Test',
          url: 'https://example.com/hook',
          secret: 'whsec_secret',
          active: true,
          events: [WebhookEvent.TICKET_CREATED],
          createdById: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      createDelivery: vi.fn().mockResolvedValue({
        id: 'delivery-1',
        tenantId: 'tenant-1',
        webhookEndpointId: 'endpoint-1',
        event: WebhookEvent.TICKET_CREATED,
        payload: {},
        status: WebhookDeliveryStatus.PENDING,
        responseStatus: null,
        responseBody: null,
        attemptCount: 0,
        deliveredAt: null,
        failedAt: null,
        createdAt: new Date(),
      }),
      updateDelivery: vi.fn().mockImplementation((_id, input) => ({
        id: 'delivery-1',
        tenantId: 'tenant-1',
        webhookEndpointId: 'endpoint-1',
        event: WebhookEvent.TICKET_CREATED,
        payload: {},
        status: input.status,
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        attemptCount: input.attemptCount,
        deliveredAt: input.deliveredAt,
        failedAt: input.failedAt,
        createdAt: new Date(),
      })),
    };

    const dispatcher = new WebhookDispatcher(repository as never);
    await dispatcher.dispatch('tenant-1', WebhookEvent.TICKET_CREATED, {
      ticketId: 'ticket-1',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = requestInit.headers as Record<string, string>;

    expect(headers['X-SupportFlow-Event']).toBe(WebhookEvent.TICKET_CREATED);
    expect(headers['X-SupportFlow-Delivery-Id']).toBe('delivery-1');
    expect(headers['X-SupportFlow-Signature']).toMatch(/^sha256=/);

    expect(repository.updateDelivery).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({
        status: WebhookDeliveryStatus.DELIVERED,
        attemptCount: 1,
      }),
    );
  });

  it('should retry on 500 and mark failed after max attempts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'error',
    });
    vi.stubGlobal('fetch', fetchMock);

    const repository = {
      findActiveByTenantAndEvent: vi.fn().mockResolvedValue([
        {
          id: 'endpoint-1',
          tenantId: 'tenant-1',
          name: 'Test',
          url: 'https://example.com/hook',
          secret: 'whsec_secret',
          active: true,
          events: [WebhookEvent.TICKET_CREATED],
          createdById: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      createDelivery: vi.fn().mockResolvedValue({
        id: 'delivery-1',
        tenantId: 'tenant-1',
        webhookEndpointId: 'endpoint-1',
        event: WebhookEvent.TICKET_CREATED,
        payload: {},
        status: WebhookDeliveryStatus.PENDING,
        responseStatus: null,
        responseBody: null,
        attemptCount: 0,
        deliveredAt: null,
        failedAt: null,
        createdAt: new Date(),
      }),
      updateDelivery: vi.fn().mockImplementation((_id, input) => ({
        id: 'delivery-1',
        status: input.status,
        attemptCount: input.attemptCount,
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
      })),
    };

    const dispatcher = new WebhookDispatcher(repository as never);
    await dispatcher.dispatch('tenant-1', WebhookEvent.TICKET_CREATED, {
      ticketId: 'ticket-1',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(repository.updateDelivery).toHaveBeenCalledWith(
      'delivery-1',
      expect.objectContaining({
        status: WebhookDeliveryStatus.FAILED,
        attemptCount: 3,
        responseStatus: 500,
      }),
    );
  });

  it('should skip dispatch when no active endpoints', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const repository = {
      findActiveByTenantAndEvent: vi.fn().mockResolvedValue([]),
      createDelivery: vi.fn(),
      updateDelivery: vi.fn(),
    };

    const dispatcher = new WebhookDispatcher(repository as never);
    await dispatcher.dispatch('tenant-1', WebhookEvent.TICKET_CREATED, {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(repository.createDelivery).not.toHaveBeenCalled();
  });
});
