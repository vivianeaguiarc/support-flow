import type {
  TicketAttachment,
  TicketAttachmentWithUploader,
} from '../../domain/ticket-attachment.js';

export type TicketAttachmentResponse = Omit<
  TicketAttachment,
  'size' | 'storagePath'
> & {
  size: string;
  fileUrl: string;
};

export type TicketAttachmentWithUploaderResponse = TicketAttachmentResponse & {
  uploadedBy: TicketAttachmentWithUploader['uploadedBy'];
};

export function buildAttachmentFileUrl(storagePath: string): string {
  return `/${storagePath.replace(/\\/g, '/')}`;
}

export function toTicketAttachmentResponse(
  attachment: TicketAttachment,
): TicketAttachmentResponse {
  const { storagePath, size, ...rest } = attachment;

  return {
    ...rest,
    size: size.toString(),
    fileUrl: buildAttachmentFileUrl(storagePath),
  };
}

export function toTicketAttachmentWithUploaderResponse(
  attachment: TicketAttachmentWithUploader,
): TicketAttachmentWithUploaderResponse {
  const { storagePath, size, uploadedBy, ...rest } = attachment;

  return {
    ...rest,
    uploadedBy,
    size: size.toString(),
    fileUrl: buildAttachmentFileUrl(storagePath),
  };
}
