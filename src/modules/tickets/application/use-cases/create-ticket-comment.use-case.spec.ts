import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../../../../shared/errors/app-error.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import {
  CommentVisibility,
  TicketPriority,
  TicketStatus,
} from '../../domain/ticket-enums.js';

vi.mock('../../infrastructure/repositories/tickets.repository.js', () => ({
  TicketsRepository: vi.fn(),
  ticketsRepository: {},
}));

vi.mock(
  '../../infrastructure/repositories/ticket-comments.repository.js',
  () => ({
    TicketCommentsRepository: vi.fn(),
    ticketCommentsRepository: {},
  }),
);

vi.mock(
  '../../infrastructure/repositories/ticket-history.repository.js',
  () => ({
    TicketHistoryRepository: vi.fn(),
    ticketHistoryRepository: {},
  }),
);

vi.mock(
  '../../../notifications/application/services/notification-event.service.js',
  () => ({
    NotificationEventService: vi.fn(),
    notificationEventService: {
      notifyCommentAdded: vi.fn(),
    },
  }),
);

import { notificationEventService } from '../../../notifications/application/services/notification-event.service.js';
import type { TicketCommentsRepository } from '../../infrastructure/repositories/ticket-comments.repository.js';
import type { TicketHistoryRepository } from '../../infrastructure/repositories/ticket-history.repository.js';
import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { CreateTicketCommentUseCase } from './create-ticket-comment.use-case.js';

const ticket: Ticket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-001',
  title: 'Ticket',
  description: 'Description',
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  categoryId: null,
  customerId: 'customer-1',
  assignedToId: 'agent-1',
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CreateTicketCommentUseCase', () => {
  let ticketsRepo: TicketsRepository;
  let commentsRepo: TicketCommentsRepository;
  let historyRepo: TicketHistoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    ticketsRepo = {
      findById: vi.fn().mockResolvedValue(ticket),
    } as unknown as TicketsRepository;
    commentsRepo = {
      create: vi.fn().mockResolvedValue({
        id: 'comment-1',
        tenantId: 'tenant-1',
        ticketId: 'ticket-1',
        authorId: 'agent-1',
        content: 'Internal note',
        visibility: CommentVisibility.INTERNAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    } as unknown as TicketCommentsRepository;
    historyRepo = {
      create: vi.fn().mockResolvedValue({}),
    } as unknown as TicketHistoryRepository;
  });

  it('should create an internal comment for an existing ticket', async () => {
    const useCase = new CreateTicketCommentUseCase(
      ticketsRepo,
      commentsRepo,
      historyRepo,
    );

    const result = await useCase.execute({
      ticketId: 'ticket-1',
      tenantId: 'tenant-1',
      authorId: 'agent-1',
      content: 'Internal note',
      visibility: CommentVisibility.INTERNAL,
      authorIsStaff: true,
    });

    expect(result.content).toBe('Internal note');
    expect(result.visibility).toBe(CommentVisibility.INTERNAL);
    expect(commentsRepo.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      authorId: 'agent-1',
      content: 'Internal note',
      visibility: CommentVisibility.INTERNAL,
    });
    expect(notificationEventService.notifyCommentAdded).toHaveBeenCalledWith(
      ticket,
      'agent-1',
      true,
    );
  });

  it('should not record ticket history for customer-authored comments', async () => {
    const useCase = new CreateTicketCommentUseCase(
      ticketsRepo,
      commentsRepo,
      historyRepo,
    );

    await useCase.execute({
      ticketId: 'ticket-1',
      tenantId: 'tenant-1',
      authorId: 'customer-1',
      content: 'Public reply',
      visibility: CommentVisibility.PUBLIC,
      authorIsStaff: false,
    });

    expect(historyRepo.create).not.toHaveBeenCalled();
  });

  it('should throw 404 when ticket does not exist', async () => {
    vi.mocked(ticketsRepo.findById).mockResolvedValue(null);

    const useCase = new CreateTicketCommentUseCase(
      ticketsRepo,
      commentsRepo,
      historyRepo,
    );

    await expect(
      useCase.execute({
        ticketId: 'missing',
        tenantId: 'tenant-1',
        authorId: 'agent-1',
        content: 'Internal note',
        visibility: CommentVisibility.INTERNAL,
        authorIsStaff: true,
      }),
    ).rejects.toEqual(new AppError('Ticket not found', 404));
  });
});
