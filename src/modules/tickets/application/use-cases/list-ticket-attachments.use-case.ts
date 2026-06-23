import { assertTicketForTenant } from '../../../../shared/security/tenant-access.js';
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
    assertTicketForTenant(
      await this.ticketsRepo.findById(input.ticketId),
      input.tenantId,
    );

    return this.attachmentsRepo.listByTicketId(input.ticketId, input.tenantId);
  }
}

export const listTicketAttachmentsUseCase = new ListTicketAttachmentsUseCase();
