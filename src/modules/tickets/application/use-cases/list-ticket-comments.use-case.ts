import { assertTicketForTenant } from '../../../../shared/security/tenant-access.js';
import type { TicketCommentWithAuthor } from '../../domain/ticket-comment.js';
import {
  type TicketCommentsRepository,
  ticketCommentsRepository,
} from '../../infrastructure/repositories/ticket-comments.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

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
    assertTicketForTenant(
      await this.ticketsRepo.findById(input.ticketId),
      input.tenantId,
    );

    return this.commentsRepo.listByTicketId(input.ticketId, input.tenantId);
  }
}

export const listTicketCommentsUseCase = new ListTicketCommentsUseCase();
