import type { Ticket } from '@prisma/client';

import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../repositories/tickets.repository.js';
import type { ListTicketsByTenantInput } from '../inputs/ticket-use-case.inputs.js';

export class ListTicketsByTenantUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(input: ListTicketsByTenantInput): Promise<Ticket[]> {
    return this.ticketsRepository.listByTenant(input.tenantId);
  }
}

export const listTicketsByTenantUseCase = new ListTicketsByTenantUseCase();
