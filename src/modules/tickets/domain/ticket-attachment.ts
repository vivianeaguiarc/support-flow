export type TicketAttachment = {
  id: string;
  tenantId: string;
  ticketId: string;
  uploadedById: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  storagePath: string;
  createdAt: Date;
};

export type TicketAttachmentWithUploader = TicketAttachment & {
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
};

export {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  type AllowedMimeType,
} from '../../../shared/constants/attachment-upload.js';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
