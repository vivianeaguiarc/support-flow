import { AppError } from '../../../../shared/errors/app-error.js';
import { TicketPriority } from '../../domain/ticket-enums.js';
import { calculateSlaDueAt, resolveSlaHours } from '../../domain/ticket-sla.js';
import {
  TenantsRepository,
  tenantsRepository as defaultTenantsRepository,
} from '../../infrastructure/repositories/tenants.repository.js';
import {
  TicketCategoriesRepository,
  ticketCategoriesRepository as defaultTicketCategoriesRepository,
} from '../../infrastructure/repositories/ticket-categories.repository.js';

export type CalculateTicketSlaInput = {
  tenantId: string;
  priority?: TicketPriority;
  categoryId?: string;
  createdAt?: Date;
};

export class CalculateTicketSlaUseCase {
  constructor(
    private readonly tenantsRepository: TenantsRepository = defaultTenantsRepository,
    private readonly ticketCategoriesRepository: TicketCategoriesRepository = defaultTicketCategoriesRepository,
  ) {}

  async execute(input: CalculateTicketSlaInput): Promise<Date> {
    const createdAt = input.createdAt ?? new Date();
    const priority = input.priority ?? TicketPriority.MEDIUM;

    const tenant = await this.tenantsRepository.findById(input.tenantId);

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    let categorySlaHours: number | null = null;

    if (input.categoryId) {
      const category = await this.ticketCategoriesRepository.findByIdAndTenant(
        input.categoryId,
        input.tenantId,
      );

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      categorySlaHours = category.slaHours;
    }

    const slaHours = resolveSlaHours({
      tenantDefaultSlaHours: tenant.defaultSlaHours,
      categorySlaHours,
      priority,
    });

    return calculateSlaDueAt(createdAt, slaHours);
  }
}

export const calculateTicketSlaUseCase = new CalculateTicketSlaUseCase();
