import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '../../../feature-flags/application/services/feature-flag.service.js',
  () => ({
    featureFlagService: {
      isEnabled: vi.fn().mockResolvedValue(true),
    },
  }),
);

vi.mock('../../../../shared/feature-flags/require-feature-flag.js', () => ({
  assertFeatureEnabled: vi.fn().mockResolvedValue(undefined),
}));

import { ConflictError } from '../../../../shared/errors/http-errors.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import {
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../../domain/ticket-enums.js';
import type { TicketHistoryRepository } from '../../infrastructure/repositories/ticket-history.repository.js';
import type { TicketSatisfactionRepository } from '../../infrastructure/repositories/ticket-satisfaction.repository.js';
import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { SubmitTicketSatisfactionUseCase } from './submit-ticket-satisfaction.use-case.js';

const ticket: Ticket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-20260624-ABC123',
  title: 'Resolved ticket',
  description: 'Description',
  status: TicketStatus.RESOLVED,
  priority: TicketPriority.MEDIUM,
  customerId: 'customer-1',
  categoryId: null,
  assignedToId: 'agent-1',
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date('2026-06-24T10:00:00.000Z'),
  updatedAt: new Date('2026-06-24T10:00:00.000Z'),
};

const authUser = {
  id: 'customer-1',
  email: 'customer@test.com',
  role: UserRole.CUSTOMER,
  tenantId: 'tenant-1',
};

describe('SubmitTicketSatisfactionUseCase', () => {
  let ticketsRepo: TicketsRepository;
  let satisfactionRepo: TicketSatisfactionRepository;
  let historyRepo: TicketHistoryRepository;
  let useCase: SubmitTicketSatisfactionUseCase;

  beforeEach(() => {
    ticketsRepo = {
      findById: vi.fn().mockResolvedValue(ticket),
    } as unknown as TicketsRepository;

    satisfactionRepo = {
      findByTicketId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'survey-1',
        tenantId: 'tenant-1',
        ticketId: 'ticket-1',
        customerId: 'customer-1',
        rating: 5,
        comment: 'Great service',
        submittedAt: new Date('2026-06-24T12:00:00.000Z'),
        createdAt: new Date('2026-06-24T12:00:00.000Z'),
      }),
    } as unknown as TicketSatisfactionRepository;

    historyRepo = {
      create: vi.fn().mockResolvedValue({ id: 'history-1' }),
    } as unknown as TicketHistoryRepository;

    useCase = new SubmitTicketSatisfactionUseCase(
      ticketsRepo,
      satisfactionRepo,
      historyRepo,
    );
  });

  it('should create survey and record history', async () => {
    const result = await useCase.execute({
      ticketId: 'ticket-1',
      tenantId: 'tenant-1',
      authUser,
      rating: 5,
      comment: 'Great service',
    });

    expect(result.rating).toBe(5);
    expect(satisfactionRepo.create).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      customerId: 'customer-1',
      rating: 5,
      comment: 'Great service',
    });
    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: TicketHistoryEvent.SATISFACTION_SUBMITTED,
        newValue: '5',
      }),
    );
  });

  it('should reject duplicate survey', async () => {
    vi.mocked(satisfactionRepo.findByTicketId).mockResolvedValue({
      id: 'existing',
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      customerId: 'customer-1',
      rating: 4,
      comment: null,
      submittedAt: new Date(),
      createdAt: new Date(),
    });

    await expect(
      useCase.execute({
        ticketId: 'ticket-1',
        tenantId: 'tenant-1',
        authUser,
        rating: 5,
      }),
    ).rejects.toThrow(ConflictError);
  });
});
