import { vi } from 'vitest';

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.JWT_REFRESH_SECRET ??= 'unit-test-refresh-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
process.env.EMAIL_ENABLED ??= 'false';
process.env.QUEUE_ENABLED ??= 'false';

const notificationEventServiceMock = {
  notifyTicketCreated: vi.fn().mockResolvedValue(undefined),
  notifyTicketAssigned: vi.fn().mockResolvedValue(undefined),
  notifyTicketStatusChanged: vi.fn().mockResolvedValue(undefined),
  notifyCommentAdded: vi.fn().mockResolvedValue(undefined),
  notifyAttachmentAdded: vi.fn().mockResolvedValue(undefined),
  notifySlaWarning: vi.fn().mockResolvedValue(undefined),
  notifySlaExpired: vi.fn().mockResolvedValue(undefined),
  notifyTicketEscalated: vi.fn().mockResolvedValue(undefined),
  notifyTicketReassigned: vi.fn().mockResolvedValue(undefined),
};

const emailNotificationServiceMock = {
  sendTicketNotification: vi.fn().mockResolvedValue(undefined),
  checkHealth: vi.fn().mockResolvedValue({
    provider: 'noop',
    enabled: false,
    configured: true,
    ready: true,
    message: 'Email delivery is disabled',
  }),
};

vi.mock(
  import('../../modules/email/application/services/notification.service.js'),
  () => ({
    NotificationService: vi.fn(),
    notificationService: emailNotificationServiceMock,
    EmailNotificationEvent: {
      TICKET_CREATED: 'TICKET_CREATED',
      TICKET_ASSIGNED: 'TICKET_ASSIGNED',
      TICKET_REASSIGNED: 'TICKET_REASSIGNED',
      TICKET_STATUS_CHANGED: 'TICKET_STATUS_CHANGED',
      TICKET_RESOLVED: 'TICKET_RESOLVED',
      TICKET_CLOSED: 'TICKET_CLOSED',
      SLA_WARNING: 'SLA_WARNING',
      SLA_BREACHED: 'SLA_BREACHED',
    },
  }),
);

vi.mock(
  import('../../modules/notifications/application/services/notification-event.service.js'),
  () => ({
    NotificationEventService: vi.fn(),
    notificationEventService: notificationEventServiceMock,
  }),
);

const automationEngineMock = {
  processEvent: vi.fn().mockResolvedValue(undefined),
};

const webhookDispatcherMock = {
  dispatch: vi.fn().mockResolvedValue(undefined),
  deliverTest: vi.fn().mockResolvedValue(undefined),
};

vi.mock(
  import('../../modules/automation/application/services/automation-engine.js'),
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../modules/automation/application/services/automation-engine.js')
      >();

    return {
      ...actual,
      automationEngine: automationEngineMock,
    };
  },
);

vi.mock(
  import('../../modules/webhooks/application/services/webhook-dispatcher.js'),
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../modules/webhooks/application/services/webhook-dispatcher.js')
      >();

    return {
      ...actual,
      webhookDispatcher: webhookDispatcherMock,
    };
  },
);

export {
  automationEngineMock,
  emailNotificationServiceMock,
  notificationEventServiceMock,
  webhookDispatcherMock,
};
