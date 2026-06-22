import type { Ticket, User } from '@prisma/client';
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

import { AppError } from '../../../shared/errors/app-error.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import type { TicketsRepository } from '../repositories/tickets.repository.js';
import { TicketsService } from './tickets.service.js';

const mockCustomer: User = {
  id: 'customer-1',
  name: 'Customer User',
  email: 'customer@example.com',
  password: 'hashed-password',
  role: UserRole.CUSTOMER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockTicket: Ticket = {
  id: 'ticket-1',
  title: 'Login issue',
  description: 'Unable to access account',
  status: TicketStatus.OPEN,
  priority: TicketPriority.HIGH,
  customerId: 'customer-1',
  assignedAgentId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createTicketsRepositoryMock(): TicketsRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    listByCustomerId: vi.fn(),
    listByAssignedAgentId: vi.fn(),
    updateStatus: vi.fn(),
    assignAgent: vi.fn(),
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

describe('TicketsService', () => {
  let ticketsRepository: TicketsRepository;
  let usersRepository: UsersRepository;
  let service: TicketsService;

  beforeEach(() => {
    ticketsRepository = createTicketsRepositoryMock();
    usersRepository = createUsersRepositoryMock();
    service = new TicketsService(ticketsRepository, usersRepository);
  });

  it('should create a ticket', async () => {
    // Arrange
    vi.mocked(usersRepository.findById).mockResolvedValue(mockCustomer);
    vi.mocked(ticketsRepository.create).mockResolvedValue(mockTicket);

    // Act
    const result = await service.create({
      title: 'Login issue',
      description: 'Unable to access account',
      customerId: 'customer-1',
      priority: TicketPriority.HIGH,
    });

    // Assert
    expect(ticketsRepository.create).toHaveBeenCalledWith({
      title: 'Login issue',
      description: 'Unable to access account',
      customerId: 'customer-1',
      priority: TicketPriority.HIGH,
      status: TicketStatus.OPEN,
    });
    expect(result).toEqual(mockTicket);
  });

  it('should reject ticket creation when customer does not exist', async () => {
    // Arrange
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.create({
        title: 'Login issue',
        description: 'Unable to access account',
        customerId: 'missing-customer',
        priority: TicketPriority.HIGH,
      }),
    ).rejects.toEqual(new AppError('Customer not found', 404));
    expect(ticketsRepository.create).not.toHaveBeenCalled();
  });

  it('should reject agent assignment when agent does not exist', async () => {
    // Arrange
    vi.mocked(ticketsRepository.findById).mockResolvedValue(mockTicket);
    vi.mocked(usersRepository.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      service.assignAgent('ticket-1', 'missing-agent'),
    ).rejects.toEqual(new AppError('Agent not found', 404));
    expect(ticketsRepository.assignAgent).not.toHaveBeenCalled();
  });
});
