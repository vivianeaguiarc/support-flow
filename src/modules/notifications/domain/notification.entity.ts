import type { NotificationType } from './notification-types.js';

export type Notification = {
  id: string;
  tenantId: string;
  recipientId: string;
  ticketId: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationWithTicket = Notification & {
  ticket: {
    id: string;
    protocol: string;
    title: string;
  };
};
