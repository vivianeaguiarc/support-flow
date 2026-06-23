import { AppError } from '../../../../shared/errors/app-error.js';
import { fileStorageService } from '../../../../shared/storage/file-storage.service.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  type TicketAttachmentsRepository,
  ticketAttachmentsRepository,
} from '../../repositories/ticket-attachments.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../repositories/tickets.repository.js';

export type DeleteTicketAttachmentInput = {
  attachmentId: string;
  ticketId: string;
  tenantId: string;
  deletedById: string;
};

export class DeleteTicketAttachmentUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly attachmentsRepo: TicketAttachmentsRepository = ticketAttachmentsRepository,
    private readonly historyRepo: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly storageService = fileStorageService,
  ) {}

  async execute(input: DeleteTicketAttachmentInput): Promise<void> {
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

    const attachment = await this.attachmentsRepo.findById(
      input.attachmentId,
      input.tenantId,
    );

    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    if (attachment.ticketId !== input.ticketId) {
      throw new AppError('Attachment does not belong to this ticket', 400);
    }

    await this.attachmentsRepo.delete(input.attachmentId, input.tenantId);

    await this.storageService.delete(attachment.storagePath);

    await this.historyRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      event: TicketHistoryEvent.ATTACHMENT_REMOVED,
      changedById: input.deletedById,
      field: 'attachment',
      oldValue: attachment.originalName,
    });
  }
}

export const deleteTicketAttachmentUseCase =
  new DeleteTicketAttachmentUseCase();
