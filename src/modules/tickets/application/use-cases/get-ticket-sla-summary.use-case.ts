import {
  resolveTicketSlaStatus,
  TicketSlaStatus,
} from '../../domain/ticket-sla-status.js';
import type { TicketSlaSummary } from '../../domain/ticket-sla-summary.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type GetTicketSlaSummaryInput = {
  tenantId: string;
};

export class GetTicketSlaSummaryUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(input: GetTicketSlaSummaryInput): Promise<TicketSlaSummary> {
    const tickets = await this.ticketsRepository.findActiveWithSlaByTenant(
      input.tenantId,
    );
    const now = new Date();

    let onTime = 0;
    let warning = 0;
    let breached = 0;

    for (const ticket of tickets) {
      if (!ticket.slaDueAt) {
        continue;
      }

      const status = resolveTicketSlaStatus(ticket.slaDueAt, now);

      if (status === TicketSlaStatus.ON_TIME) {
        onTime += 1;
      } else if (status === TicketSlaStatus.WARNING) {
        warning += 1;
      } else {
        breached += 1;
      }
    }

    return {
      onTime,
      warning,
      breached,
      total: onTime + warning + breached,
    };
  }
}

export const getTicketSlaSummaryUseCase = new GetTicketSlaSummaryUseCase();
