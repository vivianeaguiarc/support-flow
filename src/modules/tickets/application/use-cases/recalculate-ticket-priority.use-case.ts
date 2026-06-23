import { AppError } from '../../../../shared/errors/app-error.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  type TicketHistoryRepository,
  ticketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import {
  type CalculateTicketPriorityUseCase,
  calculateTicketPriorityUseCase,
} from './calculate-ticket-priority.use-case.js';

export type RecalculateTicketPriorityInput = {
  ticketId: string;
  tenantId: string;
  changedById?: string;
  forceRecalculation?: boolean;
};

export class RecalculateTicketPriorityUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly historyRepo: TicketHistoryRepository = ticketHistoryRepository,
    private readonly calculatePriority: CalculateTicketPriorityUseCase = calculateTicketPriorityUseCase,
  ) {}

  async execute(input: RecalculateTicketPriorityInput): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findById(input.ticketId);

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.tenantId !== input.tenantId) {
      throw new AppError('Invalid tenant for ticket', 403);
    }

    const wasManuallySet = await this.wasManuallySet(input.ticketId);
    const shouldRespectManualPriority =
      wasManuallySet && !input.forceRecalculation;

    const priorityResult = await this.calculatePriority.execute({
      tenantId: input.tenantId,
      title: ticket.title,
      description: ticket.description,
      categoryId: ticket.categoryId ?? undefined,
      currentPriority: input.forceRecalculation ? undefined : ticket.priority,
      manuallySet: shouldRespectManualPriority,
    });

    if (!priorityResult.priorityChanged) {
      return ticket;
    }

    const updatedTicket = await this.ticketsRepo.updatePriority(
      input.ticketId,
      priorityResult.suggestedPriority,
    );

    await this.historyRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      event: TicketHistoryEvent.PRIORITY_CHANGED,
      field: 'priority',
      oldValue: ticket.priority,
      newValue: priorityResult.suggestedPriority,
      changedById: input.changedById ?? null,
    });

    return updatedTicket;
  }

  private async wasManuallySet(ticketId: string): Promise<boolean> {
    const history = await this.historyRepo.listByTicketId(ticketId);

    const priorityChanges = history.filter(
      (h) =>
        h.event === TicketHistoryEvent.PRIORITY_CHANGED &&
        h.changedById !== null,
    );

    return priorityChanges.length > 0;
  }
}

export const recalculateTicketPriorityUseCase =
  new RecalculateTicketPriorityUseCase();
