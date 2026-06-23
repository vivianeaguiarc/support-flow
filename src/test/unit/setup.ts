import { vi } from 'vitest';

const notificationEventServiceMock = {
  notifyTicketCreated: vi.fn().mockResolvedValue(undefined),
  notifyTicketAssigned: vi.fn().mockResolvedValue(undefined),
  notifyTicketStatusChanged: vi.fn().mockResolvedValue(undefined),
  notifyCommentAdded: vi.fn().mockResolvedValue(undefined),
  notifyAttachmentAdded: vi.fn().mockResolvedValue(undefined),
  notifySlaWarning: vi.fn().mockResolvedValue(undefined),
  notifySlaExpired: vi.fn().mockResolvedValue(undefined),
  notifyTicketEscalated: vi.fn().mockResolvedValue(undefined),
};

vi.mock(
  import('../../modules/notifications/application/services/notification-event.service.js'),
  () => ({
    NotificationEventService: vi.fn(),
    notificationEventService: notificationEventServiceMock,
  }),
);

export { notificationEventServiceMock };
