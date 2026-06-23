import { AppError } from '../../../../shared/errors/app-error.js';
import type { TicketAttachmentWithUploader } from '../../domain/ticket-attachment.js';
import {
  type TicketAttachmentsRepository,
  ticketAttachmentsRepository,
} from '../../infrastructure/repositories/ticket-attachments.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type ListTicketAttachmentsInput = {
  ticketId: string;
  tenantId: string;
};

export class ListTicketAttachmentsUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly attachmentsRepo: TicketAttachmentsRepository = ticketAttachmentsRepository,
  ) {}

  async execute(
    input: ListTicketAttachmentsInput,
  ): Promise<TicketAttachmentWithUploader[]> {
    const ticket = await this.ticketsRepo.findByIdAndTenant(
      input.ticketId,
      input.tenantId,
    );

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (ticket.tenantId !== input.tenantId) {
      throw new AppError('Forbidden', 403);
    }

    return this.attachmentsRepo.listByTicketId(input.ticketId, input.tenantId);
  }
}

export const listTicketAttachmentsUseCase = new ListTicketAttachmentsUseCase();
