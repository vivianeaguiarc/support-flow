import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type Tenant,
  type TicketCategory,
  TicketPriority,
} from '../../domain/index.js';

vi.mock('../../infrastructure/repositories/tenants.repository.js', () => ({
  TenantsRepository: vi.fn(),
  tenantsRepository: {},
}));

vi.mock(
  '../../infrastructure/repositories/ticket-categories.repository.js',
  () => ({
    TicketCategoriesRepository: vi.fn(),
    ticketCategoriesRepository: {},
  }),
);

import { DEFAULT_TENANT_ID } from '../../../../shared/constants/tenant.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { TenantsRepository } from '../../infrastructure/repositories/tenants.repository.js';
import type { TicketCategoriesRepository } from '../../infrastructure/repositories/ticket-categories.repository.js';
import { CalculateTicketSlaUseCase } from './calculate-ticket-sla.use-case.js';

const mockTenant: Tenant = {
  id: DEFAULT_TENANT_ID,
  name: 'Tenant Alpha',
  slug: 'tenant-alpha',
  isActive: true,
  defaultSlaHours: 72,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockCategory: TicketCategory = {
  id: 'category-1',
  tenantId: DEFAULT_TENANT_ID,
  name: 'Ouvidoria',
  description: 'Ouvidoria channel',
  slaHours: 120,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createTenantsRepositoryMock(): TenantsRepository {
  return {
    findById: vi.fn(),
  };
}

function createTicketCategoriesRepositoryMock(): TicketCategoriesRepository {
  return {
    findByIdAndTenant: vi.fn(),
  };
}

describe('CalculateTicketSlaUseCase', () => {
  let tenantsRepository: TenantsRepository;
  let ticketCategoriesRepository: TicketCategoriesRepository;

  beforeEach(() => {
    tenantsRepository = createTenantsRepositoryMock();
    ticketCategoriesRepository = createTicketCategoriesRepositoryMock();
  });

  it('should calculate SLA due date using priority override', async () => {
    vi.mocked(tenantsRepository.findById).mockResolvedValue(mockTenant);

    const useCase = new CalculateTicketSlaUseCase(
      tenantsRepository,
      ticketCategoriesRepository,
    );

    const createdAt = new Date('2026-06-23T10:00:00.000Z');
    const dueAt = await useCase.execute({
      tenantId: DEFAULT_TENANT_ID,
      priority: TicketPriority.HIGH,
      createdAt,
    });

    expect(dueAt.toISOString()).toBe('2026-06-24T10:00:00.000Z');
  });

  it('should reject category from another tenant', async () => {
    vi.mocked(tenantsRepository.findById).mockResolvedValue(mockTenant);
    vi.mocked(ticketCategoriesRepository.findByIdAndTenant).mockResolvedValue(
      null,
    );

    const useCase = new CalculateTicketSlaUseCase(
      tenantsRepository,
      ticketCategoriesRepository,
    );

    await expect(
      useCase.execute({
        tenantId: DEFAULT_TENANT_ID,
        categoryId: 'category-1',
        priority: TicketPriority.MEDIUM,
      }),
    ).rejects.toEqual(new AppError('Category not found', 404));
  });

  it('should use tenant scoped category SLA as base before priority override', async () => {
    vi.mocked(tenantsRepository.findById).mockResolvedValue(mockTenant);
    vi.mocked(ticketCategoriesRepository.findByIdAndTenant).mockResolvedValue(
      mockCategory,
    );

    const useCase = new CalculateTicketSlaUseCase(
      tenantsRepository,
      ticketCategoriesRepository,
    );

    const createdAt = new Date('2026-06-23T10:00:00.000Z');
    const dueAt = await useCase.execute({
      tenantId: DEFAULT_TENANT_ID,
      categoryId: 'category-1',
      priority: TicketPriority.MEDIUM,
      createdAt,
    });

    expect(dueAt.toISOString()).toBe('2026-06-25T10:00:00.000Z');
  });
});
