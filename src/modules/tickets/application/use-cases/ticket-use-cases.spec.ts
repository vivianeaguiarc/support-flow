import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../../../../shared/types/user-role.js';
import type { Customer } from '../../../customers/domain/customer.entity.js';
import type { User } from '../../../users/domain/user.entity.js';
import {
  type Ticket,
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
} from '../../domain/index.js';

vi.mock('../../infrastructure/repositories/tickets.repository.js', () => ({
  TicketsRepository: vi.fn(),
  ticketsRepository: {},
}));

vi.mock(
  '../../infrastructure/repositories/ticket-history.repository.js',
  () => ({
    TicketHistoryRepository: vi.fn(),
    ticketHistoryRepository: {},
  }),
);

vi.mock(
  '../../infrastructure/repositories/ticket-categories.repository.js',
  () => ({
    TicketCategoriesRepository: vi.fn(),
    ticketCategoriesRepository: {},
  }),
);

vi.mock('../../../users/repositories/users.repository.js', () => ({
  UsersRepository: vi.fn(),
  usersRepository: {},
}));

vi.mock('../../../customers/repositories/customers.repository.js', () => ({
  CustomersRepository: vi.fn(),
  customersRepository: {},
}));

import { DEFAULT_TENANT_ID } from '../../../../shared/constants/tenant.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { CustomersRepository } from '../../../customers/repositories/customers.repository.js';
import type { UsersRepository } from '../../../users/repositories/users.repository.js';
import type { TicketCategoriesRepository } from '../../infrastructure/repositories/ticket-categories.repository.js';
import type { TicketHistoryRepository } from '../../infrastructure/repositories/ticket-history.repository.js';
import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { AssignTicketUseCase } from './assign-ticket.use-case.js';
import { CalculateTicketSlaUseCase } from './calculate-ticket-sla.use-case.js';
import { FindTicketByIdUseCase } from './find-ticket-by-id.use-case.js';
import { GetTicketStatusTransitionsUseCase } from './get-ticket-status-transitions.use-case.js';
import { ListTicketHistoryUseCase } from './list-ticket-history.use-case.js';
import { ListTicketsByTenantUseCase } from './list-tickets-by-tenant.use-case.js';
import { OpenTicketUseCase } from './open-ticket.use-case.js';
import { UpdateTicketStatusUseCase } from './update-ticket-status.use-case.js';

const mockCustomer: Customer = {
  id: 'customer-1',
  tenantId: DEFAULT_TENANT_ID,
  name: 'Customer User',
  email: 'customer@example.com',
  phone: null,
  document: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

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

const mockTicket: Ticket = {
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
};

function createTicketsRepositoryMock(): TicketsRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndTenant: vi.fn(),
    listByTenant: vi.fn(),
    listWithFilters: vi.fn(),
    list: vi.fn(),
    listByCustomerId: vi.fn(),
    listByAssignedToId: vi.fn(),
    updateStatus: vi.fn(),
    assignTo: vi.fn(),
  };
}

function createTicketHistoryRepositoryMock(): TicketHistoryRepository {
  return {
    create: vi.fn(),
    listByTicketId: vi.fn(),
    listByTicketIdAndTenant: vi.fn(),
  };
}

function createUsersRepositoryMock(): UsersRepository {
  return {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
  };
}

function createCustomersRepositoryMock(): CustomersRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
  };
}

function createTicketCategoriesRepositoryMock(): TicketCategoriesRepository {
  return {
    findByIdAndTenant: vi.fn(),
  };
}

function createCalculateTicketSlaMock() {
  return {
    execute: vi.fn().mockResolvedValue(new Date('2026-01-03T00:00:00.000Z')),
  };
}

describe('Ticket use cases', () => {
  let ticketsRepository: TicketsRepository;
  let ticketHistoryRepository: TicketHistoryRepository;
  let usersRepository: UsersRepository;
  let customersRepository: CustomersRepository;

  beforeEach(() => {
    ticketsRepository = createTicketsRepositoryMock();
    ticketHistoryRepository = createTicketHistoryRepositoryMock();
    usersRepository = createUsersRepositoryMock();
    customersRepository = createCustomersRepositoryMock();
  });

  describe('OpenTicketUseCase', () => {
    it('should create ticket with OPEN status, SLA and CREATED history', async () => {
      const slaDueAt = new Date('2026-01-03T00:00:00.000Z');
      const calculateTicketSla = {
        execute: vi.fn().mockResolvedValue(slaDueAt),
      };

      vi.mocked(customersRepository.findById).mockResolvedValue(mockCustomer);
      vi.mocked(ticketsRepository.create).mockResolvedValue({
        ...mockTicket,
        slaDueAt,
      });

      const useCase = new OpenTicketUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        customersRepository,
        usersRepository,
        createTicketCategoriesRepositoryMock(),
        calculateTicketSla as unknown as CalculateTicketSlaUseCase,
      );

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        title: 'Login issue',
        description: 'Unable to access account',
        customerId: 'customer-1',
        priority: TicketPriority.HIGH,
      });

      expect(calculateTicketSla.execute).toHaveBeenCalledWith({
        tenantId: DEFAULT_TENANT_ID,
        priority: TicketPriority.HIGH,
        categoryId: undefined,
      });
      expect(ticketsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: DEFAULT_TENANT_ID,
          status: TicketStatus.OPEN,
          slaDueAt,
          protocol: expect.stringMatching(/^SF-\d{8}-[A-Z0-9]{6}$/),
        }),
      );
      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.CREATED,
          ticketId: mockTicket.id,
        }),
      );
      expect(result.slaDueAt).toEqual(slaDueAt);
    });

    it('should reject customer from another tenant', async () => {
      vi.mocked(customersRepository.findById).mockResolvedValue({
        ...mockCustomer,
        tenantId: 'other-tenant',
      });

      const useCase = new OpenTicketUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        customersRepository,
        usersRepository,
        createTicketCategoriesRepositoryMock(),
        createCalculateTicketSlaMock() as unknown as CalculateTicketSlaUseCase,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          title: 'Login issue',
          description: 'Unable to access account',
          customerId: 'customer-1',
        }),
      ).rejects.toEqual(new AppError('Invalid tenant for customer', 403));
    });
  });

  describe('FindTicketByIdUseCase', () => {
    it('should return ticket when found in tenant', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );

      const useCase = new FindTicketByIdUseCase(ticketsRepository);
      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
      });

      expect(result).toEqual(mockTicket);
    });

    it('should throw when ticket is not found in tenant', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(null);

      const useCase = new FindTicketByIdUseCase(ticketsRepository);

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'missing',
        }),
      ).rejects.toEqual(new AppError('Ticket not found', 404));
    });
  });

  describe('ListTicketsByTenantUseCase', () => {
    it('should list tickets scoped by tenant with filters', async () => {
      vi.mocked(ticketsRepository.listWithFilters).mockResolvedValue({
        data: [mockTicket],
        total: 1,
        page: 1,
        limit: 10,
      });

      const useCase = new ListTicketsByTenantUseCase(ticketsRepository);
      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(ticketsRepository.listWithFilters).toHaveBeenCalledWith({
        tenantId: DEFAULT_TENANT_ID,
        status: TicketStatus.OPEN,
        priority: TicketPriority.HIGH,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(result).toEqual({
        data: [mockTicket],
        total: 1,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('UpdateTicketStatusUseCase', () => {
    it('should update status and record history when assignee is set', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue({
        ...mockTicket,
        assignedToId: 'agent-1',
      });
      vi.mocked(ticketsRepository.updateStatus).mockResolvedValue({
        ...mockTicket,
        assignedToId: 'agent-1',
        status: TicketStatus.IN_PROGRESS,
      });

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new UpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        findTicket,
      );

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
        status: TicketStatus.IN_PROGRESS,
      });

      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.STATUS_CHANGED,
          oldValue: TicketStatus.OPEN,
          newValue: TicketStatus.IN_PROGRESS,
        }),
      );
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should reject OPEN to IN_PROGRESS without assignee', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new UpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        findTicket,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          status: TicketStatus.IN_PROGRESS,
        }),
      ).rejects.toEqual(
        new AppError(
          'Ticket must be assigned before moving to IN_PROGRESS.',
          400,
        ),
      );

      expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
      expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('should reject ESCALATED to IN_PROGRESS without assignee', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.ESCALATED,
      });

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new UpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        findTicket,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          status: TicketStatus.IN_PROGRESS,
        }),
      ).rejects.toEqual(
        new AppError(
          'Ticket must be assigned before moving to IN_PROGRESS.',
          400,
        ),
      );
    });

    it('should allow ESCALATED to IN_PROGRESS with assignee', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.ESCALATED,
        assignedToId: 'agent-1',
      });
      vi.mocked(ticketsRepository.updateStatus).mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.IN_PROGRESS,
        assignedToId: 'agent-1',
      });

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new UpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        findTicket,
      );

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
        status: TicketStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should reject invalid status transition without persisting changes', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new UpdateTicketStatusUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        findTicket,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          status: TicketStatus.CLOSED,
        }),
      ).rejects.toEqual(
        new AppError('Invalid status transition from OPEN to CLOSED', 400),
      );

      expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
      expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('GetTicketStatusTransitionsUseCase', () => {
    it('should return current status and allowed transitions', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new GetTicketStatusTransitionsUseCase(findTicket);

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
      });

      expect(result).toEqual({
        currentStatus: TicketStatus.OPEN,
        allowedTransitions: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED],
      });
    });

    it('should throw when ticket is not found in tenant', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(null);

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new GetTicketStatusTransitionsUseCase(findTicket);

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'missing',
        }),
      ).rejects.toEqual(new AppError('Ticket not found', 404));
    });
  });

  describe('ListTicketHistoryUseCase', () => {
    it('should return mapped history ordered by tenant scope', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );
      vi.mocked(
        ticketHistoryRepository.listByTicketIdAndTenant,
      ).mockResolvedValue([
        {
          id: 'history-1',
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          event: TicketHistoryEvent.CREATED,
          field: null,
          oldValue: null,
          newValue: null,
          changedById: 'agent-1',
          createdAt: new Date('2026-06-23T09:00:00.000Z'),
          changedBy: {
            id: 'agent-1',
            name: 'Atendente Demo',
            email: 'atendente@supportflow.com',
          },
        },
        {
          id: 'history-2',
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          event: TicketHistoryEvent.STATUS_CHANGED,
          field: 'status',
          oldValue: TicketStatus.OPEN,
          newValue: TicketStatus.IN_PROGRESS,
          changedById: 'agent-1',
          createdAt: new Date('2026-06-23T10:00:00.000Z'),
          changedBy: {
            id: 'agent-1',
            name: 'Atendente Demo',
            email: 'atendente@supportflow.com',
          },
        },
      ]);

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new ListTicketHistoryUseCase(
        ticketHistoryRepository,
        findTicket,
      );

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
      });

      expect(
        ticketHistoryRepository.listByTicketIdAndTenant,
      ).toHaveBeenCalledWith('ticket-1', DEFAULT_TENANT_ID);
      expect(result.ticketId).toBe('ticket-1');
      expect(result.history).toHaveLength(2);
      expect(result.history[0]).toEqual({
        id: 'history-1',
        action: TicketHistoryEvent.CREATED,
        previousValue: null,
        newValue: null,
        performedById: 'agent-1',
        performedBy: {
          name: 'Atendente Demo',
          email: 'atendente@supportflow.com',
        },
        createdAt: new Date('2026-06-23T09:00:00.000Z'),
      });
    });

    it('should throw when ticket is not found in tenant', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(null);

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new ListTicketHistoryUseCase(
        ticketHistoryRepository,
        findTicket,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'missing',
        }),
      ).rejects.toEqual(new AppError('Ticket not found', 404));

      expect(
        ticketHistoryRepository.listByTicketIdAndTenant,
      ).not.toHaveBeenCalled();
    });
  });

  describe('AssignTicketUseCase', () => {
    it('should assign agent and record history', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );
      vi.mocked(usersRepository.findById).mockResolvedValue(mockAgent);
      vi.mocked(ticketsRepository.assignTo).mockResolvedValue({
        ...mockTicket,
        assignedToId: 'agent-1',
      });

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new AssignTicketUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        usersRepository,
        findTicket,
      );

      const result = await useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        ticketId: 'ticket-1',
        assignedToId: 'agent-1',
      });

      expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event: TicketHistoryEvent.ASSIGNED,
          newValue: 'agent-1',
        }),
      );
      expect(result.assignedToId).toBe('agent-1');
    });

    it('should reject agent from another tenant', async () => {
      vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
        mockTicket,
      );
      vi.mocked(usersRepository.findById).mockResolvedValue({
        ...mockAgent,
        tenantId: 'other-tenant',
      });

      const findTicket = new FindTicketByIdUseCase(ticketsRepository);
      const useCase = new AssignTicketUseCase(
        ticketsRepository,
        ticketHistoryRepository,
        usersRepository,
        findTicket,
      );

      await expect(
        useCase.execute({
          tenantId: DEFAULT_TENANT_ID,
          ticketId: 'ticket-1',
          assignedToId: 'agent-1',
        }),
      ).rejects.toEqual(new AppError('Invalid tenant for agent', 403));
    });
  });
});
