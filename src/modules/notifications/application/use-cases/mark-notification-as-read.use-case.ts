import { AppError } from '../../../../shared/errors/app-error.js';
import {
  type NotificationsRepository,
  notificationsRepository,
} from '../../repositories/notifications.repository.js';

export type MarkNotificationAsReadInput = {
  notificationId: string;
  recipientId: string;
  tenantId: string;
};

export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationsRepo: NotificationsRepository = notificationsRepository,
  ) {}

  async execute(input: MarkNotificationAsReadInput): Promise<void> {
    const notification = await this.notificationsRepo.findById(
      input.notificationId,
      input.recipientId,
      input.tenantId,
    );

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.readAt) {
      return;
    }

    await this.notificationsRepo.markAsRead(
      input.notificationId,
      input.recipientId,
      input.tenantId,
    );
  }
}

export const markNotificationAsReadUseCase =
  new MarkNotificationAsReadUseCase();
