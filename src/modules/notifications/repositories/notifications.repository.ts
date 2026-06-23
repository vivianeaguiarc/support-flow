import { prisma } from '../../../shared/database/prisma.js';
import type {
  Notification,
  NotificationWithTicket,
} from '../domain/notification.entity.js';
import type { NotificationType } from '../domain/notification-types.js';

export type CreateNotificationData = {
  tenantId: string;
  recipientId: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
};

export type ListNotificationsFilter = {
  tenantId: string;
  recipientId: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};

export class NotificationsRepository {
  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = await prisma.notification.create({
      data,
    });

    return {
      id: notification.id,
      tenantId: notification.tenantId,
      recipientId: notification.recipientId,
      ticketId: notification.ticketId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  async findById(
    id: string,
    recipientId: string,
    tenantId: string,
  ): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        recipientId,
        tenantId,
      },
    });

    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      tenantId: notification.tenantId,
      recipientId: notification.recipientId,
      ticketId: notification.ticketId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }

  async list(
    filter: ListNotificationsFilter,
  ): Promise<NotificationWithTicket[]> {
    const where: {
      tenantId: string;
      recipientId: string;
      readAt?: null;
    } = {
      tenantId: filter.tenantId,
      recipientId: filter.recipientId,
    };

    if (filter.unreadOnly) {
      where.readAt = null;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            protocol: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      tenantId: notification.tenantId,
      recipientId: notification.recipientId,
      ticketId: notification.ticketId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      ticket: {
        id: notification.ticket.id,
        protocol: notification.ticket.protocol,
        title: notification.ticket.title,
      },
    }));
  }

  async markAsRead(
    id: string,
    recipientId: string,
    tenantId: string,
  ): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id,
        recipientId,
        tenantId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(recipientId: string, tenantId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId,
        tenantId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async countUnread(recipientId: string, tenantId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        recipientId,
        tenantId,
        readAt: null,
      },
    });
  }
}

export const notificationsRepository = new NotificationsRepository();
