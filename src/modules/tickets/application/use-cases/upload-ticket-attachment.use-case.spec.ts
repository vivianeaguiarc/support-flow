import { beforeEach, describe, expect, it, vi } from 'vitest';

import { samplePdfBuffer } from '../../../../test/integration/file-fixtures.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import { UploadTicketAttachmentUseCase } from './upload-ticket-attachment.use-case.js';

describe('UploadTicketAttachmentUseCase', () => {
  const ticketsRepo = { findById: vi.fn() };
  const attachmentsRepo = { create: vi.fn() };
  const historyRepo = { create: vi.fn() };
  const storageService = { save: vi.fn() };
  const notificationService = { notifyAttachmentAdded: vi.fn() };

  const ticket = {
    id: 'ticket-1',
    tenantId: 'tenant-1',
    customerId: 'customer-1',
    status: 'OPEN',
  };

  const file = {
    buffer: samplePdfBuffer,
    originalname: 'comprovante.pdf',
    mimetype: 'application/pdf',
    size: samplePdfBuffer.length,
  } as Express.Multer.File;

  beforeEach(() => {
    vi.clearAllMocks();
    ticketsRepo.findById.mockResolvedValue(ticket);
    storageService.save.mockResolvedValue({
      fileName: 'stored.pdf',
      storagePath: 'storage/attachments/stored.pdf',
    });
    attachmentsRepo.create.mockResolvedValue({
      id: 'attachment-1',
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      uploadedById: 'agent-1',
      fileName: 'stored.pdf',
      originalName: 'comprovante.pdf',
      mimeType: 'application/pdf',
      size: BigInt(128),
      storagePath: 'storage/attachments/stored.pdf',
      createdAt: new Date(),
    });
  });

  it('should save file, persist attachment and record history', async () => {
    const useCase = new UploadTicketAttachmentUseCase(
      ticketsRepo as never,
      attachmentsRepo as never,
      historyRepo as never,
      storageService as never,
      notificationService as never,
    );

    const result = await useCase.execute({
      ticketId: 'ticket-1',
      tenantId: 'tenant-1',
      uploadedById: 'agent-1',
      file,
    });

    expect(storageService.save).toHaveBeenCalledWith(
      file,
      'tenant-1',
      'ticket-1',
    );
    expect(attachmentsRepo.create).toHaveBeenCalled();
    expect(historyRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event: TicketHistoryEvent.ATTACHMENT_ADDED,
        newValue: 'comprovante.pdf',
      }),
    );
    expect(notificationService.notifyAttachmentAdded).toHaveBeenCalled();
    expect(result.id).toBe('attachment-1');
  });
});
