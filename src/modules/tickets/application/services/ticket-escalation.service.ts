import {
  type EscalateTicketsBySlaResult,
  type EscalateTicketsBySlaUseCase,
  escalateTicketsBySlaUseCase,
} from '../use-cases/escalate-tickets-by-sla.use-case.js';

export class TicketEscalationService {
  constructor(
    private readonly escalateTicketsUseCase: EscalateTicketsBySlaUseCase = escalateTicketsBySlaUseCase,
  ) {}

  async escalateOverdueTickets(): Promise<EscalateTicketsBySlaResult> {
    const result = await this.escalateTicketsUseCase.execute();

    console.log('[Ticket Escalation] Execution completed:', {
      ticketsChecked: result.ticketsChecked,
      ticketsEscalated: result.ticketsEscalated,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}

export const ticketEscalationService = new TicketEscalationService();
