import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('./notification.service.js');

vi.mock('../../../../config/env.js', () => ({
  env: {
    EMAIL_ENABLED: true,
    LOG_LEVEL: 'warn',
    NODE_ENV: 'test',
  },
}));

vi.mock('../../../../shared/logger/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { addEmailJobMock } = vi.hoisted(() => ({
  addEmailJobMock: vi.fn().mockResolvedValue('job-1'),
}));

vi.mock('../../../queues/queue-provider.js', () => ({
  queueProvider: {
    addEmailJob: addEmailJobMock,
  },
}));

import type { EmailProvider } from '../../../../shared/email/index.js';
import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import {
  TicketPriority,
  TicketStatus,
} from '../../../tickets/domain/ticket-enums.js';
import { EmailNotificationEvent } from '../../domain/email-notification-event.js';
import { NotificationService } from './notification.service.js';

const ticket: Ticket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'TK-001',
  title: 'Chamado teste',
  description: 'Descrição',
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: 'agent-1',
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NotificationService', () => {
  const provider: EmailProvider = {
    name: 'mock',
    send: vi.fn().mockResolvedValue(undefined),
    checkHealth: vi.fn().mockResolvedValue({
      provider: 'mock',
      enabled: true,
      configured: true,
      ready: true,
      message: 'ok',
    }),
  };

  const usersRepository = {
    findById: vi.fn().mockResolvedValue({
      id: 'agent-1',
      name: 'Agente',
      email: 'agent@test.com',
      tenantId: 'tenant-1',
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enqueue ticket notification job', async () => {
    const service = new NotificationService(provider, usersRepository as never);

    await service.sendTicketNotification({
      event: EmailNotificationEvent.TICKET_ASSIGNED,
      ticket,
      recipientId: 'agent-1',
    });

    expect(addEmailJobMock).toHaveBeenCalledWith({
      event: EmailNotificationEvent.TICKET_ASSIGNED,
      ticketId: ticket.id,
      tenantId: ticket.tenantId,
      recipientId: 'agent-1',
    });
    expect(provider.send).not.toHaveBeenCalled();
  });

  it('should render template and send email via deliverTicketEmail', async () => {
    const service = new NotificationService(provider, usersRepository as never);

    await service.deliverTicketEmail({
      event: EmailNotificationEvent.TICKET_ASSIGNED,
      ticket,
      recipientId: 'agent-1',
    });

    expect(provider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'agent@test.com',
        subject: 'Chamado atribuído a você',
        html: expect.stringContaining('Chamado teste'),
      }),
    );
  });

  it('should skip send when recipient is missing', async () => {
    usersRepository.findById.mockResolvedValueOnce(null);
    const service = new NotificationService(provider, usersRepository as never);

    await service.deliverTicketEmail({
      event: EmailNotificationEvent.TICKET_CREATED,
      ticket,
      recipientId: 'missing',
    });

    expect(provider.send).not.toHaveBeenCalled();
  });

  it('should propagate provider failures from deliverTicketEmail', async () => {
    vi.mocked(provider.send).mockRejectedValueOnce(new Error('smtp down'));
    const service = new NotificationService(provider, usersRepository as never);

    await expect(
      service.deliverTicketEmail({
        event: EmailNotificationEvent.SLA_BREACHED,
        ticket,
        recipientId: 'agent-1',
        context: { hoursOverdue: 2 },
      }),
    ).rejects.toThrow('smtp down');
  });
});
