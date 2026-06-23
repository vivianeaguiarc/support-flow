import { vi } from 'vitest';

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.JWT_REFRESH_SECRET ??= 'unit-test-refresh-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

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
