import { AppError } from '../../../../shared/errors/app-error.js';
import type { TicketCommentWithAuthor } from '../../domain/ticket-comment.js';
import {
  type TicketCommentsRepository,
  ticketCommentsRepository,
} from '../../repositories/ticket-comments.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../repositories/tickets.repository.js';

export type ListTicketCommentsInput = {
  ticketId: string;
  tenantId: string;
};

export class ListTicketCommentsUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly commentsRepo: TicketCommentsRepository = ticketCommentsRepository,
  ) {}

  async execute(
    input: ListTicketCommentsInput,
  ): Promise<TicketCommentWithAuthor[]> {
    const ticket = await this.ticketsRepo.findById(
      input.ticketId,
      input.tenantId,
    );

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.tenantId !== input.tenantId) {
      throw new AppError('Forbidden', 403);
    }

    return this.commentsRepo.listByTicketId(input.ticketId, input.tenantId);
  }
}

export const listTicketCommentsUseCase = new ListTicketCommentsUseCase();
