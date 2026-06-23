import type { PaginatedTicketList } from '../../domain/ticket-paginated-list.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../repositories/tickets.repository.js';
import type { ListTicketsInput } from '../inputs/ticket-use-case.inputs.js';

export class ListTicketsByTenantUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(input: ListTicketsInput): Promise<PaginatedTicketList> {
    return this.ticketsRepository.listWithFilters(input);
  }
}

export const listTicketsByTenantUseCase = new ListTicketsByTenantUseCase();
