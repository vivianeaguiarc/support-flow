import type { Customer, Ticket } from '@prisma/client';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../repositories/tickets.repository.js', () => ({
  TicketsRepository: vi.fn(),
  ticketsRepository: {},
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
    list: vi.fn(),
    listByCustomerId: vi.fn(),
    listByAssignedToId: vi.fn(),
    updateStatus: vi.fn(),
    assignTo: vi.fn(),
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
  let usersRepository: UsersRepository;
  let customersRepository: CustomersRepository;
  let service: TicketsService;

  beforeEach(() => {
    ticketsRepository = createTicketsRepositoryMock();
    usersRepository = createUsersRepositoryMock();
    customersRepository = createCustomersRepositoryMock();
    service = new TicketsService(
      ticketsRepository,
      usersRepository,
      customersRepository,
    );
  });

  it('should allow CUSTOMER to create a ticket for themselves', async () => {
    // Arrange
    vi.mocked(customersRepository.findById).mockResolvedValue(mockCustomer);
    vi.mocked(ticketsRepository.create).mockResolvedValue(mockTicket);

    // Act
    const result = await service.create(
      {
        title: 'Login issue',
        description: 'Unable to access account',
        customerId: 'customer-1',
        priority: TicketPriority.HIGH,
      },
      customerAuth,
    );

    // Assert
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
    expect(result).toEqual(mockTicket);
  });

  it('should reject CUSTOMER creating a ticket for another customer', async () => {
    // Act & Assert
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
    // Arrange
    vi.mocked(ticketsRepository.findById).mockResolvedValue(
      otherCustomerTicket,
    );

    // Act & Assert
    await expect(service.findById('ticket-2', customerAuth)).rejects.toEqual(
      new AppError('Forbidden', 403),
    );
  });

  it('should allow AGENT to update ticket status', async () => {
    // Arrange
    vi.mocked(ticketsRepository.findById).mockResolvedValue(mockTicket);
    vi.mocked(ticketsRepository.updateStatus).mockResolvedValue({
      ...mockTicket,
      status: TicketStatus.IN_PROGRESS,
    });

    // Act
    const result = await service.updateStatus(
      'ticket-1',
      TicketStatus.IN_PROGRESS,
      agentAuth,
    );

    // Assert
    expect(ticketsRepository.updateStatus).toHaveBeenCalledWith(
      'ticket-1',
      TicketStatus.IN_PROGRESS,
    );
    expect(result.status).toBe(TicketStatus.IN_PROGRESS);
  });

  it('should allow ADMIN to access any ticket', async () => {
    // Arrange
    vi.mocked(ticketsRepository.findById).mockResolvedValue(
      otherCustomerTicket,
    );

    // Act
    const result = await service.findById('ticket-2', adminAuth);

    // Assert
    expect(result).toEqual(otherCustomerTicket);
  });

  it('should reject ticket creation when customer does not exist', async () => {
    // Arrange
    vi.mocked(customersRepository.findById).mockResolvedValue(null);

    // Act & Assert
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
    // Arrange
    vi.mocked(ticketsRepository.findById).mockResolvedValue(mockTicket);
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.assignAgent('ticket-1', 'missing-agent', agentAuth),
    ).rejects.toEqual(new AppError('Agent not found', 404));
    expect(ticketsRepository.assignTo).not.toHaveBeenCalled();
  });

  it('should reject CUSTOMER listing another customer tickets', async () => {
    // Act & Assert
    await expect(
      service.listByCustomerId('customer-2', customerAuth),
    ).rejects.toEqual(new AppError('Forbidden', 403));
    expect(ticketsRepository.listByCustomerId).not.toHaveBeenCalled();
  });

  it('should reject CUSTOMER updating ticket status', async () => {
    // Act & Assert
    await expect(
      service.updateStatus('ticket-1', TicketStatus.CLOSED, customerAuth),
    ).rejects.toEqual(new AppError('Forbidden', 403));
    expect(ticketsRepository.updateStatus).not.toHaveBeenCalled();
  });
});
