import type { NotificationWithTicket } from '../../domain/notification.entity.js';
import {
  type NotificationsRepository,
  notificationsRepository,
} from '../../infrastructure/repositories/notifications.repository.js';

export type ListNotificationsInput = {
  tenantId: string;
  recipientId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};

export class ListNotificationsUseCase {
  constructor(
    private readonly notificationsRepo: NotificationsRepository = notificationsRepository,
  ) {}

  async execute(
    input: ListNotificationsInput,
  ): Promise<NotificationWithTicket[]> {
    return this.notificationsRepo.list(input);
  }
}

export const listNotificationsUseCase = new ListNotificationsUseCase();
