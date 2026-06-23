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
  ) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    return this.notificationsRepo.create(input);
  }
}

export const createNotificationUseCase = new CreateNotificationUseCase();
