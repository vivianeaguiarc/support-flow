import { AppError } from '../../../../shared/errors/app-error.js';
import { fileStorageService } from '../../../../shared/storage/file-storage.service.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import type { TicketAttachment } from '../../domain/ticket-attachment.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import { assertAllowedFileContent } from '../../domain/validate-file-content.js';
import {
  type TicketAttachmentsRepository,
  ticketAttachmentsRepository,
} from '../../infrastructure/repositories/ticket-attachments.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type UploadTicketAttachmentInput = {
  ticketId: string;
  tenantId: string;
  uploadedById: string;
  file: Express.Multer.File;
};

export class UploadTicketAttachmentUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly attachmentsRepo: TicketAttachmentsRepository = ticketAttachmentsRepository,
    private readonly historyRepo: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly storageService = fileStorageService,
    private readonly notificationService: NotificationEventService = notificationEventService,
  ) {}

  async execute(input: UploadTicketAttachmentInput): Promise<TicketAttachment> {
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

    assertAllowedFileContent(input.file.buffer, input.file.mimetype);

    const { fileName, storagePath } = await this.storageService.save(
      input.file,
      input.tenantId,
      input.ticketId,
    );

    const attachment = await this.attachmentsRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      uploadedById: input.uploadedById,
      fileName,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      size: input.file.size,
      storagePath,
    });

    await this.historyRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      event: TicketHistoryEvent.ATTACHMENT_ADDED,
      changedById: input.uploadedById,
      field: 'attachment',
      newValue: input.file.originalname,
    });

    await this.notificationService.notifyAttachmentAdded(
      ticket,
      input.uploadedById,
      input.file.originalname,
    );

    return attachment;
  }
}

export const uploadTicketAttachmentUseCase =
  new UploadTicketAttachmentUseCase();
