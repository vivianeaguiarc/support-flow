import { z } from 'zod';

export const ticketAttachmentParamsSchema = z.object({
  id: z.uuid('Invalid ticket ID'),
  attachmentId: z.uuid('Invalid attachment ID'),
});

export type TicketAttachmentParamsDto = z.infer<
  typeof ticketAttachmentParamsSchema
>;
