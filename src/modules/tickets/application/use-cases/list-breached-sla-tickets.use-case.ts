import type { Ticket } from '../../domain/ticket.entity.js';
import {
  calculateSlaHoursOverdue,
  TicketSlaStatus,
} from '../../domain/ticket-sla-status.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type BreachedSlaTicket = Ticket & {
  slaStatus: typeof TicketSlaStatus.BREACHED;
  hoursOverdue: number;
};

export type ListBreachedSlaTicketsInput = {
  tenantId: string;
  page?: number;
  limit?: number;
};

export type ListBreachedSlaTicketsResult = {
  data: BreachedSlaTicket[];
  total: number;
  page: number;
  limit: number;
};

export class ListBreachedSlaTicketsUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(
    input: ListBreachedSlaTicketsInput,
  ): Promise<ListBreachedSlaTicketsResult> {
    const result = await this.ticketsRepository.listBreachedSlaByTenant(input);
    const now = new Date();

    return {
      ...result,
      data: result.data.map((ticket) => ({
        ...ticket,
        slaStatus: TicketSlaStatus.BREACHED,
        hoursOverdue: ticket.slaDueAt
          ? calculateSlaHoursOverdue(ticket.slaDueAt, now)
          : 0,
      })),
    };
  }
}

export const listBreachedSlaTicketsUseCase =
  new ListBreachedSlaTicketsUseCase();
