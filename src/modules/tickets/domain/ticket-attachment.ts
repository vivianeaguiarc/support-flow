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

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'text/plain',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.txt',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
