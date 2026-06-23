import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import {
  TicketPriority,
  TicketStatus,
} from '../../../tickets/domain/ticket-enums.js';
import { NotificationType } from '../../domain/notification-types.js';
import type { CreateNotificationUseCase } from '../use-cases/create-notification.use-case.js';

const baseTicket: Ticket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'TK-2026-000001',
  title: 'Reclamação Ouvidoria',
  description: 'Estorno não creditado',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: 'agent-1',
  slaDueAt: new Date('2026-06-25T18:00:00.000Z'),
  closedAt: null,
  createdAt: new Date('2026-06-23T10:00:00.000Z'),
  updatedAt: new Date('2026-06-23T10:00:00.000Z'),
};

describe('NotificationEventService', () => {
  let createNotification: CreateNotificationUseCase;
  let service: InstanceType<
    (typeof import('./notification-event.service.js'))['NotificationEventService']
  >;

  beforeEach(async () => {
    const { NotificationEventService } = await vi.importActual<
      typeof import('./notification-event.service.js')
    >('./notification-event.service.js');

    createNotification = {
      execute: vi.fn().mockResolvedValue({ id: 'notification-1' }),
    };
    service = new NotificationEventService(createNotification);
  });

  it('should notify assignee when ticket is assigned', async () => {
    await service.notifyTicketAssigned(baseTicket, 'agent-1');

    expect(createNotification.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      recipientId: 'agent-1',
      ticketId: 'ticket-1',
      type: NotificationType.TICKET_ASSIGNED,
      title: 'Chamado atribuído a você',
      message: expect.stringContaining('Reclamação Ouvidoria'),
    });
  });

  it('should notify assignee on status change', async () => {
    await service.notifyTicketStatusChanged(
      baseTicket,
      TicketStatus.OPEN,
      TicketStatus.IN_PROGRESS,
    );

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TICKET_STATUS_CHANGED,
        recipientId: 'agent-1',
      }),
    );
  });

  it('should skip status notification when ticket has no assignee', async () => {
    await service.notifyTicketStatusChanged(
      { ...baseTicket, assignedToId: null },
      TicketStatus.OPEN,
      TicketStatus.ESCALATED,
    );

    expect(createNotification.execute).not.toHaveBeenCalled();
  });

  it('should notify SLA warning to assignee', async () => {
    await service.notifySlaWarning(baseTicket);

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.SLA_WARNING,
        recipientId: 'agent-1',
      }),
    );
  });

  it('should notify SLA expired to assignee', async () => {
    await service.notifySlaExpired(baseTicket);

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.SLA_EXPIRED,
        recipientId: 'agent-1',
      }),
    );
  });

  it('should notify internal comment to assignee when author differs', async () => {
    await service.notifyCommentAdded(baseTicket, 'agent-2', true);

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.TICKET_COMMENT_ADDED,
        title: 'Novo comentário interno',
        recipientId: 'agent-1',
      }),
    );
  });

  it('should skip comment notification when author is assignee', async () => {
    await service.notifyCommentAdded(baseTicket, 'agent-1', true);

    expect(createNotification.execute).not.toHaveBeenCalled();
  });
});
