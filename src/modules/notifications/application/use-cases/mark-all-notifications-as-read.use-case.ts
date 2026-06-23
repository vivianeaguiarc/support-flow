import {
  type NotificationsRepository,
  notificationsRepository,
} from '../../repositories/notifications.repository.js';

export type MarkAllNotificationsAsReadInput = {
  recipientId: string;
  tenantId: string;
};

export type MarkAllNotificationsAsReadOutput = {
  count: number;
};

export class MarkAllNotificationsAsReadUseCase {
  constructor(
    private readonly notificationsRepo: NotificationsRepository = notificationsRepository,
  ) {}

  async execute(
    input: MarkAllNotificationsAsReadInput,
  ): Promise<MarkAllNotificationsAsReadOutput> {
    const count = await this.notificationsRepo.markAllAsRead(
      input.recipientId,
      input.tenantId,
    );

    return { count };
  }
}

export const markAllNotificationsAsReadUseCase =
  new MarkAllNotificationsAsReadUseCase();
