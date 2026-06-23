import type { Customer, Ticket } from '@prisma/client';
import {
  TicketHistoryEvent,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/tickets.repository.js', () => ({
  TicketsRepository: vi.fn(),
  ticketsRepository: {},
}));

vi.mock('../repositories/ticket-history.repository.js', () => ({
  TicketHistoryRepository: vi.fn(),
  ticketHistoryRepository: {},
}));

vi.mock('../repositories/ticket-categories.repository.js', () => ({
  TicketCategoriesRepository: vi.fn(),
  ticketCategoriesRepository: {},
}));

vi.mock('../repositories/ticket-categories.repository.js', () => ({
  TicketCategoriesRepository: vi.fn(),
  ticketCategoriesRepository: {},
}));

vi.mock('../repositories/tenants.repository.js', () => ({
  TenantsRepository: vi.fn(),
  tenantsRepository: {},
}));

vi.mock('../../users/repositories/users.repository.js', () => ({
  UsersRepository: vi.fn(),
  usersRepository: {},
}));

vi.mock('../../customers/repositories/customers.repository.js', () => ({
  CustomersRepository: vi.fn(),
  customersRepository: {},
}));

import { DEFAULT_TENANT_ID } from '../../../shared/constants/tenant.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../../../shared/types/authenticated-user.js';
import type { CustomersRepository } from '../../customers/repositories/customers.repository.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import { AssignTicketUseCase } from '../application/use-cases/assign-ticket.use-case.js';
import { CalculateTicketSlaUseCase } from '../application/use-cases/calculate-ticket-sla.use-case.js';
import { FindTicketByIdUseCase } from '../application/use-cases/find-ticket-by-id.use-case.js';
import { GetTicketStatusTransitionsUseCase } from '../application/use-cases/get-ticket-status-transitions.use-case.js';
import { ListTicketHistoryUseCase } from '../application/use-cases/list-ticket-history.use-case.js';
import { ListTicketsByTenantUseCase } from '../application/use-cases/list-tickets-by-tenant.use-case.js';
import { OpenTicketUseCase } from '../application/use-cases/open-ticket.use-case.js';
import { UpdateTicketStatusUseCase } from '../application/use-cases/update-ticket-status.use-case.js';
import type { TicketHistoryRepository } from '../repositories/ticket-history.repository.js';
import type { TicketsRepository } from '../repositories/tickets.repository.js';
import { TicketsService } from './tickets.service.js';

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

const mockTicket: Ticket = {
  id: 'ticket-1',
  tenantId: DEFAULT_TENANT_ID,
  protocol: 'SF-20260101-ABC123',
  title: 'Login issue',
  description: 'Unable to access account',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  categoryId: null,
  customerId: 'customer-1',
  assignedToId: null,
  slaDueAt: null,
  closedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const otherCustomerTicket: Ticket = {
  ...mockTicket,
  id: 'ticket-2',
  customerId: 'customer-2',
};

const customerAuth: AuthenticatedUser = {
  id: 'customer-1',
  email: 'customer@example.com',
  role: UserRole.CUSTOMER,
  tenantId: DEFAULT_TENANT_ID,
};

const agentAuth: AuthenticatedUser = {
  id: 'agent-1',
  email: 'agent@example.com',
  role: UserRole.AGENT,
  tenantId: DEFAULT_TENANT_ID,
};

const adminAuth: AuthenticatedUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  tenantId: DEFAULT_TENANT_ID,
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

describe('TicketsService', () => {
  let ticketsRepository: TicketsRepository;
  let ticketHistoryRepository: TicketHistoryRepository;
  let usersRepository: UsersRepository;
  let customersRepository: CustomersRepository;
  let service: TicketsService;

  beforeEach(() => {
    ticketsRepository = createTicketsRepositoryMock();
    ticketHistoryRepository = createTicketHistoryRepositoryMock();
    usersRepository = createUsersRepositoryMock();
    customersRepository = createCustomersRepositoryMock();

    const openTicket = new OpenTicketUseCase(
      ticketsRepository,
      ticketHistoryRepository,
      customersRepository,
      usersRepository,
      undefined,
      {
        execute: vi
          .fn()
          .mockResolvedValue(new Date('2026-01-03T00:00:00.000Z')),
      } as unknown as CalculateTicketSlaUseCase,
    );
    const findTicket = new FindTicketByIdUseCase(ticketsRepository);
    const listTickets = new ListTicketsByTenantUseCase(ticketsRepository);
    const updateTicketStatus = new UpdateTicketStatusUseCase(
      ticketsRepository,
      ticketHistoryRepository,
      findTicket,
    );
    const assignTicket = new AssignTicketUseCase(
      ticketsRepository,
      ticketHistoryRepository,
      usersRepository,
      findTicket,
    );
    const getTicketStatusTransitions = new GetTicketStatusTransitionsUseCase(
      findTicket,
    );
    const listTicketHistory = new ListTicketHistoryUseCase(
      ticketHistoryRepository,
      findTicket,
    );

    service = new TicketsService(
      openTicket,
      findTicket,
      listTickets,
      updateTicketStatus,
      assignTicket,
      getTicketStatusTransitions,
      listTicketHistory,
      ticketsRepository,
    );
  });

  it('should allow CUSTOMER to create a ticket for themselves', async () => {
    vi.mocked(customersRepository.findById).mockResolvedValue(mockCustomer);
    vi.mocked(ticketsRepository.create).mockResolvedValue({
      ...mockTicket,
      slaDueAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    vi.mocked(ticketHistoryRepository.create).mockResolvedValue({
      id: 'history-1',
      tenantId: DEFAULT_TENANT_ID,
      ticketId: 'ticket-1',
      event: 'CREATED',
      field: null,
      oldValue: null,
      newValue: null,
      changedById: 'customer-1',
      createdAt: new Date(),
    });

    const result = await service.create(
      {
        title: 'Login issue',
        description: 'Unable to access account',
        customerId: 'customer-1',
        priority: TicketPriority.HIGH,
      },
      customerAuth,
    );

    expect(ticketsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: DEFAULT_TENANT_ID,
        title: 'Login issue',
        description: 'Unable to access account',
        customerId: 'customer-1',
        priority: TicketPriority.HIGH,
        status: TicketStatus.OPEN,
        protocol: expect.stringMatching(/^SF-\d{8}-[A-Z0-9]{6}$/),
      }),
    );
    expect(ticketHistoryRepository.create).toHaveBeenCalled();
    expect(result).toEqual({
      ...mockTicket,
      slaDueAt: new Date('2026-01-03T00:00:00.000Z'),
    });
  });

  it('should reject CUSTOMER creating a ticket for another customer', async () => {
    await expect(
      service.create(
        {
          title: 'Login issue',
          description: 'Unable to access account',
          customerId: 'customer-2',
          priority: TicketPriority.HIGH,
        },
        customerAuth,
      ),
    ).rejects.toEqual(new AppError('Forbidden', 403));
    expect(ticketsRepository.create).not.toHaveBeenCalled();
  });

  it('should reject CUSTOMER accessing another customer ticket', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
      otherCustomerTicket,
    );

    await expect(service.findById('ticket-2', customerAuth)).rejects.toEqual(
      new AppError('Forbidden', 403),
    );
  });

  it('should allow AGENT to update ticket status when assignee is set', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue({
      ...mockTicket,
      assignedToId: 'agent-1',
    });
    vi.mocked(ticketsRepository.updateStatus).mockResolvedValue({
      ...mockTicket,
      assignedToId: 'agent-1',
      status: TicketStatus.IN_PROGRESS,
    });

    const result = await service.updateStatus(
      'ticket-1',
      TicketStatus.IN_PROGRESS,
      agentAuth,
    );

    expect(ticketsRepository.updateStatus).toHaveBeenCalledWith(
      'ticket-1',
      TicketStatus.IN_PROGRESS,
    );
    expect(ticketHistoryRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'STATUS_CHANGED',
        field: 'status',
        oldValue: TicketStatus.OPEN,
        newValue: TicketStatus.IN_PROGRESS,
      }),
    );
    expect(result.status).toBe(TicketStatus.IN_PROGRESS);
  });

  it('should reject IN_PROGRESS when ticket has no assignee', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
      mockTicket,
    );

    await expect(
      service.updateStatus('ticket-1', TicketStatus.IN_PROGRESS, agentAuth),
    ).rejects.toEqual(
      new AppError(
        'Ticket must be assigned before moving to IN_PROGRESS.',
        400,
      ),
    );

    expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
    expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
  });

  it('should allow ADMIN to access any ticket', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
      otherCustomerTicket,
    );

    const result = await service.findById('ticket-2', adminAuth);

    expect(result).toEqual(otherCustomerTicket);
  });

  it('should reject ticket creation when customer does not exist', async () => {
    vi.mocked(customersRepository.findById).mockResolvedValue(null);

    await expect(
      service.create(
        {
          title: 'Login issue',
          description: 'Unable to access account',
          customerId: 'missing-customer',
          priority: TicketPriority.HIGH,
        },
        adminAuth,
      ),
    ).rejects.toEqual(new AppError('Customer not found', 404));
    expect(ticketsRepository.create).not.toHaveBeenCalled();
  });

  it('should reject agent assignment when agent does not exist', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
      mockTicket,
    );
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    await expect(
      service.assignAgent('ticket-1', 'missing-agent', agentAuth),
    ).rejects.toEqual(new AppError('Agent not found', 404));
    expect(ticketsRepository.assignTo).not.toHaveBeenCalled();
  });

  it('should reject CUSTOMER listing another customer tickets', async () => {
    await expect(
      service.listByCustomerId('customer-2', customerAuth),
    ).rejects.toEqual(new AppError('Forbidden', 403));
    expect(ticketsRepository.listByCustomerId).not.toHaveBeenCalled();
  });

  it('should reject CUSTOMER updating ticket status', async () => {
    await expect(
      service.updateStatus('ticket-1', TicketStatus.CLOSED, customerAuth),
    ).rejects.toEqual(new AppError('Forbidden', 403));
    expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('should return allowed status transitions for an accessible ticket', async () => {
    vi.mocked(ticketsRepository.findByIdAndTenant).mockResolvedValue(
      mockTicket,
    );

    const result = await service.getStatusTransitions('ticket-1', agentAuth);

    expect(result).toEqual({
      currentStatus: TicketStatus.OPEN,
      allowedTransitions: [TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED],
    });
    expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
    expect(ticketHistoryRepository.create).not.toHaveBeenCalled();
  });

  it('should return ticket history for an accessible ticket', async () => {
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

    const result = await service.getHistory('ticket-1', agentAuth);

    expect(
      ticketHistoryRepository.listByTicketIdAndTenant,
    ).toHaveBeenCalledWith('ticket-1', DEFAULT_TENANT_ID);
    expect(result).toEqual({
      ticketId: 'ticket-1',
      history: [
        {
          id: 'history-1',
          action: TicketHistoryEvent.STATUS_CHANGED,
          previousValue: TicketStatus.OPEN,
          newValue: TicketStatus.IN_PROGRESS,
          performedById: 'agent-1',
          performedBy: {
            name: 'Atendente Demo',
            email: 'atendente@supportflow.com',
          },
          createdAt: new Date('2026-06-23T10:00:00.000Z'),
        },
      ],
    });
  });
});
