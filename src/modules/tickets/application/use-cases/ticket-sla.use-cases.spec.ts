import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketPriority, TicketStatus } from '../../domain/ticket-enums.js';
import { TicketSlaStatus } from '../../domain/ticket-sla-status.js';

vi.mock('../../infrastructure/repositories/tickets.repository.js', () => ({
  TicketsRepository: vi.fn(),
  ticketsRepository: {},
}));

import type { TicketsRepository } from '../../infrastructure/repositories/tickets.repository.js';
import { GetTicketSlaSummaryUseCase } from './get-ticket-sla-summary.use-case.js';

const baseTicket: Ticket = {
  id: 'ticket-1',
  tenantId: 'tenant-1',
  protocol: 'SF-001',
  title: 'Ticket',
  description: 'Description',
  status: TicketStatus.OPEN,
  priority: TicketPriority.MEDIUM,
  categoryId: null,
  customerId: 'customer-1',
  assignedToId: null,
  slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createRepositoryMock(): TicketsRepository {
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
    updatePriority: vi.fn(),
    assignTo: vi.fn(),
    findAll: vi.fn(),
    countActiveTicketsByAgent: vi.fn(),
    findUnassignedOpenTickets: vi.fn(),
    findActiveWithSlaByTenant: vi.fn(),
    listBreachedSlaByTenant: vi.fn(),
  };
}

describe('GetTicketSlaSummaryUseCase', () => {
  let repository: TicketsRepository;

  beforeEach(() => {
    repository = createRepositoryMock();
  });

  it('should aggregate SLA totals by status', async () => {
    vi.mocked(repository.findActiveWithSlaByTenant).mockResolvedValue([
      {
        ...baseTicket,
        id: 'on-time',
        slaDueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      {
        ...baseTicket,
        id: 'warning',
        slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
      {
        ...baseTicket,
        id: 'breached',
        slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ]);

    const useCase = new GetTicketSlaSummaryUseCase(repository);
    const summary = await useCase.execute({ tenantId: 'tenant-1' });

    expect(summary).toEqual({
      onTime: 1,
      warning: 1,
      breached: 1,
      total: 3,
    });
  });
});

describe('ListBreachedSlaTicketsUseCase', () => {
  it('should enrich breached tickets with SLA metadata', async () => {
    const repository = createRepositoryMock();
    const breachedTicket = {
      ...baseTicket,
      slaDueAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    };

    vi.mocked(repository.listBreachedSlaByTenant).mockResolvedValue({
      data: [breachedTicket],
      total: 1,
      page: 1,
      limit: 10,
    });

    const { ListBreachedSlaTicketsUseCase } =
      await import('./list-breached-sla-tickets.use-case.js');
    const useCase = new ListBreachedSlaTicketsUseCase(repository);
    const result = await useCase.execute({ tenantId: 'tenant-1' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].slaStatus).toBe(TicketSlaStatus.BREACHED);
    expect(result.data[0].hoursOverdue).toBeGreaterThanOrEqual(2);
  });
});
