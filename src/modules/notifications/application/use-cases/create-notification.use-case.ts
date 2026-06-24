import {
  OutboxService,
  outboxService,
} from '../../../outbox/application/services/outbox.service.js';
import { OutboxEventName } from '../../../outbox/domain/outbox-event-names.js';
import type { Notification } from '../../domain/notification.entity.js';
import type { NotificationType } from '../../domain/notification-types.js';
import {
  type NotificationsRepository,
  notificationsRepository,
} from '../../infrastructure/repositories/notifications.repository.js';

export type CreateNotificationInput = {
  tenantId: string;
  recipientId: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
};

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationsRepo: NotificationsRepository = notificationsRepository,
    private readonly outbox: OutboxService = outboxService,
  ) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    const notification = await this.notificationsRepo.create(input);

    await this.outbox.recordSideEffect({
      eventName: OutboxEventName.NOTIFICATION_SENT,
      aggregateId: notification.id,
      payload: {
        tenantId: input.tenantId,
        recipientId: input.recipientId,
        ticketId: input.ticketId,
        type: input.type,
        channel: 'in_app',
      },
    });

    return notification;
  }
}

export const createNotificationUseCase = new CreateNotificationUseCase();
