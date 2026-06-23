import { AppError } from '../../../../shared/errors/app-error.js';
import type { TicketComment } from '../../domain/ticket-comment.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  type TicketCommentsRepository,
  ticketCommentsRepository,
} from '../../repositories/ticket-comments.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../repositories/tickets.repository.js';

export type CreateTicketCommentInput = {
  ticketId: string;
  tenantId: string;
  authorId: string;
  content: string;
};

export class CreateTicketCommentUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly commentsRepo: TicketCommentsRepository = ticketCommentsRepository,
    private readonly historyRepo: TicketHistoryRepository = defaultTicketHistoryRepository,
  ) {}

  async execute(input: CreateTicketCommentInput): Promise<TicketComment> {
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

    const comment = await this.commentsRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      authorId: input.authorId,
      content: input.content,
    });

    await this.historyRepo.create({
      ticketId: input.ticketId,
      tenantId: input.tenantId,
      event: TicketHistoryEvent.COMMENT_ADDED,
      changedById: input.authorId,
      field: 'comment',
      newValue: `Comment added by user ${input.authorId}`,
    });

    return comment;
  }
}

export const createTicketCommentUseCase = new CreateTicketCommentUseCase();
