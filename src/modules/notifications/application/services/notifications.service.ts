import { resolveTenantId } from '../../../../shared/tenant/get-request-tenant-id.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { NotificationWithTicket } from '../../domain/notification.entity.js';
import {
  ListNotificationsUseCase,
  listNotificationsUseCase,
  type MarkAllNotificationsAsReadOutput,
  MarkAllNotificationsAsReadUseCase,
  markAllNotificationsAsReadUseCase,
  MarkNotificationAsReadUseCase,
  markNotificationAsReadUseCase,
} from '../index.js';

export class NotificationsService {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase = listNotificationsUseCase,
    private readonly markNotificationAsRead: MarkNotificationAsReadUseCase = markNotificationAsReadUseCase,
    private readonly markAllNotificationsAsRead: MarkAllNotificationsAsReadUseCase = markAllNotificationsAsReadUseCase,
  ) {}

  async getUserNotifications(
    authUser: AuthenticatedUser,
    unreadOnly?: boolean,
    limit?: number,
    offset?: number,
  ): Promise<NotificationWithTicket[]> {
    const tenantId = resolveTenantId(authUser);

    return this.listNotifications.execute({
      tenantId,
      recipientId: authUser.id,
      unreadOnly,
      limit,
      offset,
    });
  }

  async markAsRead(
    notificationId: string,
    authUser: AuthenticatedUser,
  ): Promise<void> {
    const tenantId = resolveTenantId(authUser);

    return this.markNotificationAsRead.execute({
      notificationId,
      recipientId: authUser.id,
      tenantId,
    });
  }

  async markAllAsRead(
    authUser: AuthenticatedUser,
  ): Promise<MarkAllNotificationsAsReadOutput> {
    const tenantId = resolveTenantId(authUser);

    return this.markAllNotificationsAsRead.execute({
      recipientId: authUser.id,
      tenantId,
    });
  }
}

export const notificationsService = new NotificationsService();
