import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type {
  WebhookDelivery,
  WebhookEndpoint,
  WebhookEndpointWithSecret,
} from '../../domain/webhook-endpoint.entity.js';
import {
  WebhooksRepository,
  webhooksRepository as defaultWebhooksRepository,
} from '../../infrastructure/repositories/webhooks.repository.js';
import type {
  CreateWebhookDto,
  UpdateWebhookDto,
} from '../../presentation/dtos/webhook.dto.js';
import {
  type WebhookDispatcher,
  webhookDispatcher as defaultWebhookDispatcher,
} from './webhook-dispatcher.js';
import { generateWebhookSecret } from './webhook-signature.js';

export class WebhooksService {
  constructor(
    private readonly repository: WebhooksRepository = defaultWebhooksRepository,
    private readonly dispatcher: WebhookDispatcher = defaultWebhookDispatcher,
  ) {}

  async create(
    authUser: AuthenticatedUser,
    input: CreateWebhookDto,
  ): Promise<WebhookEndpointWithSecret> {
    const secret = generateWebhookSecret();

    const endpoint = await this.repository.create({
      tenantId: authUser.tenantId,
      name: input.name,
      url: input.url,
      secret,
      events: input.events,
      createdById: authUser.id,
    });

    logBusinessEvent(BusinessEvent.WEBHOOK_CREATED, {
      tenantId: authUser.tenantId,
      webhookEndpointId: endpoint.id,
      actorId: authUser.id,
      events: input.events,
    });

    return endpoint;
  }

  async list(authUser: AuthenticatedUser): Promise<WebhookEndpoint[]> {
    return this.repository.findAllByTenant(authUser.tenantId);
  }

  async getById(
    authUser: AuthenticatedUser,
    id: string,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.repository.findById(authUser.tenantId, id);

    if (!endpoint) {
      throw new NotFoundError('Webhook not found');
    }

    return endpoint;
  }

  async update(
    authUser: AuthenticatedUser,
    id: string,
    input: UpdateWebhookDto,
  ): Promise<WebhookEndpoint> {
    const endpoint = await this.repository.update(authUser.tenantId, id, input);

    if (!endpoint) {
      throw new NotFoundError('Webhook not found');
    }

    logBusinessEvent(BusinessEvent.WEBHOOK_UPDATED, {
      tenantId: authUser.tenantId,
      webhookEndpointId: endpoint.id,
      actorId: authUser.id,
    });

    return endpoint;
  }

  async delete(authUser: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.repository.findById(authUser.tenantId, id);

    if (!existing) {
      throw new NotFoundError('Webhook not found');
    }

    await this.repository.delete(authUser.tenantId, id);

    logBusinessEvent(BusinessEvent.WEBHOOK_DELETED, {
      tenantId: authUser.tenantId,
      webhookEndpointId: id,
      actorId: authUser.id,
    });
  }

  async test(
    authUser: AuthenticatedUser,
    id: string,
  ): Promise<WebhookDelivery> {
    const endpoint = await this.repository.findByIdWithSecret(
      authUser.tenantId,
      id,
    );

    if (!endpoint) {
      throw new NotFoundError('Webhook not found');
    }

    const delivery = await this.dispatcher.deliverTest(endpoint);

    logBusinessEvent(BusinessEvent.WEBHOOK_TEST_SENT, {
      tenantId: authUser.tenantId,
      webhookEndpointId: endpoint.id,
      actorId: authUser.id,
      deliveryId: delivery.id,
      status: delivery.status,
    });

    return delivery;
  }
}

export const webhooksService = new WebhooksService();
