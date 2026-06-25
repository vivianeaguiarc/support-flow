import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_TENANT_ID } from '../../../../shared/constants/tenant.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import type { User } from '../../../users/domain/user.entity.js';
import {
  type Ticket,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../../domain/index.js';

vi.mock('../../../../shared/database/prisma.js', () => ({
  prisma: {
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({}),
    ),
  },
}));

vi.mock('../../../outbox/application/services/outbox.service.js', () => ({
  outboxService: {
    enqueueInTransaction: vi.fn().mockResolvedValue(undefined),
    recordSideEffect: vi.fn().mockResolvedValue(undefined),
  },
  OutboxService: vi.fn(),
}));

vi.mock('../../../outbox/application/services/outbox-relay.service.js', () => ({
  outboxRelayService: {
    scheduleRelay: vi.fn().mockResolvedValue(undefined),
  },
  OutboxRelayService: vi.fn(),
}));

import type { OutboxService } from '../../../outbox/application/services/outbox.service.js';
import type { OutboxRelayService } from '../../../outbox/application/services/outbox-relay.service.js';
import type { UsersRepository } from '../../../users/repositories/users.repository.js';
import type { TicketHistoryRepository } from '../../infrastructure/repositories/ticket-history.repository.js';
import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { BulkAssignTicketsUseCase } from './bulk-assign-tickets.use-case.js';
import { BulkUpdateTicketStatusUseCase } from './bulk-update-ticket-status.use-case.js';

const txMatcher = expect.anything();

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    tenantId: DEFAULT_TENANT_ID,
    protocol: 'SF-20260101-ABC123',
    title: 'Login issue',
    description: 'Unable to access account',
    status: TicketStatus.OPEN,
    priority: TicketPriority.MEDIUM,
    categoryId: null,
    customerId: 'customer-1',
    assignedToId: null,
    slaDueAt: null,
    closedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const mockAgent: User = {
  id: 'agent-1',
  tenantId: DEFAULT_TENANT_ID,
  name: 'Agent User',
  email: 'agent@example.com',
  password: 'hashed',
  role: UserRole.AGENT,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createTicketsRepositoryMock(): TicketsRepository {
  return {
    findManyByIdsAndTenant: vi.fn(),
    updateStatus: vi.fn(),
    assignTo: vi.fn(),
  } as unknown as TicketsRepository;
}

function createTicketHistoryRepositoryMock(): TicketHistoryRepository {
  return {
    create: vi.fn(),
  } as unknown as TicketHistoryRepository;
}

function createUsersRepositoryMock(): UsersRepository {
  return {
    findById: vi.fn(),
  } as unknown as UsersRepository;
}

function createOutboxMock(): OutboxService {
  return {
    enqueueInTransaction: vi.fn().mockResolvedValue(undefined),
  } as unknown as OutboxService;
}

function createOutboxRelayMock(): OutboxRelayService {
  return {
    scheduleRelay: vi.fn().mockResolvedValue(undefined),
  } as unknown as OutboxRelayService;
}

describe('Bulk ticket operations', () => {
  let ticketsRepository: TicketsRepository;
  let ticketHistoryRepository: TicketHistoryRepository;
  let usersRepository: UsersRepository;
  let outbox: OutboxService;
  let outboxRelay: OutboxRelayService;

  beforeEach(() => {
    ticketsRepository = createTicketsRepositoryMock();
    ticketHistoryRepository = createTicketHistoryRepositoryMock();
    usersRepository = createUsersRepositoryMock();
    outbox = createOutboxMock();
    outboxRelay = createOutboxRelayMock();
  });

  describe('BulkUpdateTicketStatusUseCase', () => {
    function createUseCase(): BulkUpdateTicketStatusUseCase {
      return new BulkUpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        outbox,
        outboxRelay,
      );
    }

    it('updates status of multiple tickets and records history with reason', async () => {
      const tickets = [
        makeTicket({ id: 'ticket-1', assignedToId: 'agent-1' }),
        makeTicket({ id: 'ticket-2', assignedToId: 'agent-1' }),
      ];
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue(
        tickets,
      );
      vi.mocked(ticketsRepository.updateStatus).mockImplementation(async (id) =>
        makeTicket({
          id,
          assignedToId: 'agent-1',
          status: TicketStatus.IN_PROGRESS,
        }),
      );

      const result = await createUseCase().execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketIds: ['ticket-1', 'ticket-2'],
        status: TicketStatus.IN_PROGRESS,
        changedById: 'admin-1',
        reason: 'Mutirão de atendimento',
      });

      expect(result).toEqual({
        totalRequested: 2,
        totalUpdated: 2,
        updatedTicketIds: ['ticket-1', 'ticket-2'],
        operation: 'bulk_status_update',
        message: 'Tickets updated successfully.',
      });
      expect(ticketsRepository.updateStatus).toHaveBeenCalledTimes(2);
      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.STATUS_CHANGED,
          oldValue: TicketStatus.OPEN,
          newValue: TicketStatus.IN_PROGRESS,
          metadata: { reason: 'Mutirão de atendimento' },
        }),
        txMatcher,
      );
      expect(outboxRelay.scheduleRelay).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when a ticket is missing or from another tenant', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1', assignedToId: 'agent-1' }),
      ]);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1', 'ticket-2'],
          status: TicketStatus.IN_PROGRESS,
        }),
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
      expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('rolls back (no writes) and throws 409 on invalid transition', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1', status: TicketStatus.OPEN }),
        makeTicket({ id: 'ticket-2', status: TicketStatus.RESOLVED }),
      ]);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1', 'ticket-2'],
          status: TicketStatus.CLOSED,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
      expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
      expect(outboxRelay.scheduleRelay).not.toHaveBeenCalled();
    });

    it('throws 409 when moving to IN_PROGRESS without assignee', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1', assignedToId: null }),
      ]);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1'],
          status: TicketStatus.IN_PROGRESS,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('BulkAssignTicketsUseCase', () => {
    function createUseCase(): BulkAssignTicketsUseCase {
      return new BulkAssignTicketsUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        usersRepository,
        outbox,
        outboxRelay,
      );
    }

    it('assigns multiple tickets and records assignment history', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1', assignedToId: null }),
        makeTicket({ id: 'ticket-2', assignedToId: 'agent-old' }),
      ]);
      vi.mocked(usersRepository.findById).mockResolvedValue(mockAgent);
      vi.mocked(ticketsRepository.assignTo).mockImplementation(
        async (id, assignedToId) => makeTicket({ id, assignedToId }),
      );

      const result = await createUseCase().execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketIds: ['ticket-1', 'ticket-2'],
        assignedToId: 'agent-1',
        changedById: 'admin-1',
      });

      expect(result).toMatchObject({
        totalRequested: 2,
        totalUpdated: 2,
        operation: 'bulk_assign',
        message: 'Tickets assigned successfully.',
      });
      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.ASSIGNED,
          newValue: 'agent-1',
        }),
        txMatcher,
      );
      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.REASSIGNED,
          oldValue: 'agent-old',
          newValue: 'agent-1',
        }),
        txMatcher,
      );
      expect(outboxRelay.scheduleRelay).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when a ticket is missing', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1' }),
      ]);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1', 'ticket-2'],
          assignedToId: 'agent-1',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(ticketsRepository.assignTo).not.toHaveBeenCalled();
    });

    it('throws 409 and rolls back when a ticket is closed', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1', status: TicketStatus.OPEN }),
        makeTicket({ id: 'ticket-2', status: TicketStatus.CLOSED }),
      ]);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1', 'ticket-2'],
          assignedToId: 'agent-1',
        }),
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(usersRepository.findById).not.toHaveBeenCalled();
      expect(ticketsRepository.assignTo).not.toHaveBeenCalled();
    });

    it('throws 404 when the agent does not exist', async () => {
      vi.mocked(ticketsRepository.findManyByIdsAndTenant).mockResolvedValue([
        makeTicket({ id: 'ticket-1' }),
      ]);
      vi.mocked(usersRepository.findById).mockResolvedValue(null);

      await expect(
        createUseCase().execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketIds: ['ticket-1'],
          assignedToId: 'agent-1',
        }),
      ).rejects.toEqual(new AppError('Agent not found', 404));

      expect(ticketsRepository.assignTo).not.toHaveBeenCalled();
    });
  });
});
