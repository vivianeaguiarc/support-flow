import {
  type AutoAssignTicketsResult,
  type AutoAssignTicketsUseCase,
  autoAssignTicketsUseCase,
} from '../application/use-cases/auto-assign-tickets.use-case.js';

export class TicketAutoAssignmentService {
  constructor(
    private readonly autoAssignUseCase: AutoAssignTicketsUseCase = autoAssignTicketsUseCase,
  ) {}

  async autoAssignTickets(tenantId: string): Promise<AutoAssignTicketsResult> {
    const result = await this.autoAssignUseCase.execute(tenantId);

    console.log('[Auto-Assignment] Execution completed:', {
      tenantId,
      ticketsProcessed: result.ticketsProcessed,
      ticketsAssigned: result.ticketsAssigned,
      failedAssignments: result.failedAssignments,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}

export const ticketAutoAssignmentService = new TicketAutoAssignmentService();
