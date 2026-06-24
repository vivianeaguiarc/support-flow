import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NotificationEventService } from '../../../notifications/application/services/notification-event.service.js';
import type { NotificationsRepository } from '../../../notifications/infrastructure/repositories/notifications.repository.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketPriority, TicketStatus } from '../../domain/ticket-enums.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import type { TicketHistoryRepository } from '../../infrastructure/repositories/ticket-history.repository.js';
import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { MonitorTicketSlaUseCase } from './monitor-ticket-sla.use-case.js';

const baseTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'TK-2026-000001',
  title: 'Chamado SLA',
  description: 'Teste de SLA',
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: 'agent-1',
  slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
  closedAt: null,
  createdAt: new Date('2026-06-23T10:00:00.000Z'),
  updatedAt: new Date('2026-06-23T10:00:00.000Z'),
  ...overrides,
});

describe('MonitorTicketSlaUseCase', () => {
  let ticketsRepo: TicketsRepository;
  let notificationsRepo: NotificationsRepository;
  let notificationEvents: NotificationEventService;
  let historyRepo: TicketHistoryRepository;
  let useCase: MonitorTicketSlaUseCase;

  beforeEach(() => {
    ticketsRepo = {
      findAll: vi.fn(),
    } as unknown as TicketsRepository;

    notificationsRepo = {
      countByTicketAndType: vi.fn().mockResolvedValue(0),
    } as unknown as NotificationsRepository;

    notificationEvents = {
      notifySlaWarning: vi.fn().mockResolvedValue(undefined),
      notifySlaExpired: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotificationEventService;

    historyRepo = {
      hasEventByTicketId: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockResolvedValue({ id: 'history-1' }),
    } as unknown as TicketHistoryRepository;

    useCase = new MonitorTicketSlaUseCase(
      ticketsRepo,
      notificationsRepo,
      notificationEvents,
      historyRepo,
    );
  });

  it('should create SLA_WARNING for ticket expiring within 24 hours', async () => {
    vi.mocked(ticketsRepo.findAll).mockResolvedValue([
      baseTicket({
        slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      }),
    ]);

    const result = await useCase.execute();

    expect(result).toMatchObject({
      ticketsChecked: 1,
      warningsCreated: 1,
      expiredNotificationsCreated: 0,
    });
    expect(notificationEvents.notifySlaWarning).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ticket-1' }),
      expect.objectContaining({ hoursRemaining: expect.any(Number) }),
    );
  });

  it('should create SLA_EXPIRED for overdue ticket', async () => {
    vi.mocked(ticketsRepo.findAll).mockResolvedValue([
      baseTicket({
        slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      }),
    ]);

    const result = await useCase.execute();

    expect(result).toMatchObject({
      ticketsChecked: 1,
      warningsCreated: 0,
      expiredNotificationsCreated: 1,
      slaBreachedHistoryCreated: 1,
    });
    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: TicketHistoryEvent.SLA_BREACHED,
        ticketId: 'ticket-1',
      }),
    );
    expect(notificationEvents.notifySlaExpired).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ticket-1' }),
      expect.objectContaining({ hoursOverdue: expect.any(Number) }),
    );
  });

  it('should not duplicate SLA_WARNING when notification already exists', async () => {
    vi.mocked(ticketsRepo.findAll).mockResolvedValue([
      baseTicket({
        slaDueAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      }),
    ]);
    vi.mocked(notificationsRepo.countByTicketAndType).mockResolvedValue(1);

    const result = await useCase.execute();

    expect(result.warningsCreated).toBe(0);
    expect(notificationEvents.notifySlaWarning).not.toHaveBeenCalled();
  });

  it('should skip tickets without assignee', async () => {
    vi.mocked(ticketsRepo.findAll).mockResolvedValue([
      baseTicket({
        assignedToId: null,
        slaDueAt: new Date(Date.now() - 60 * 60 * 1000),
      }),
    ]);

    const result = await useCase.execute();

    expect(result.expiredNotificationsCreated).toBe(0);
    expect(result.slaBreachedHistoryCreated).toBe(1);
    expect(notificationEvents.notifySlaExpired).not.toHaveBeenCalled();
    expect(historyRepo.create).toHaveBeenCalled();
  });
});
