import { describe, expect, it } from 'vitest';

import {
  buildAttachmentFileUrl,
  toTicketAttachmentResponse,
} from './to-ticket-attachment-response.js';

describe('toTicketAttachmentResponse', () => {
  it('should expose fileUrl derived from storage path', () => {
    const response = toTicketAttachmentResponse({
      id: 'attachment-1',
      tenantId: 'tenant-1',
      ticketId: 'ticket-1',
      uploadedById: 'user-1',
      fileName: 'stored.pdf',
      originalName: 'comprovante.pdf',
      mimeType: 'application/pdf',
      size: BigInt(1024),
      storagePath: 'storage/attachments/stored.pdf',
      createdAt: new Date('2026-06-24T12:00:00.000Z'),
    });

    expect(response.fileUrl).toBe('/storage/attachments/stored.pdf');
    expect(response.size).toBe('1024');
    expect(response).not.toHaveProperty('storagePath');
  });

  it('should normalize windows-style storage paths', () => {
    expect(buildAttachmentFileUrl('storage\\attachments\\file.png')).toBe(
      '/storage/attachments/file.png',
    );
  });
});
