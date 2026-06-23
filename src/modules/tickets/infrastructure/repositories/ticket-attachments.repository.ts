import { prisma } from '../../../../shared/database/prisma.js';
import type {
  TicketAttachment,
  TicketAttachmentWithUploader,
} from '../../domain/ticket-attachment.js';

export type CreateAttachmentData = {
  tenantId: string;
  ticketId: string;
  uploadedById: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  storagePath: string;
};

export class TicketAttachmentsRepository {
  async create(data: CreateAttachmentData): Promise<TicketAttachment> {
    const attachment = await prisma.ticketAttachment.create({
      data: {
        ...data,
        size: BigInt(data.size),
      },
    });

    return {
      id: attachment.id,
      tenantId: attachment.tenantId,
      ticketId: attachment.ticketId,
      uploadedById: attachment.uploadedById,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storagePath: attachment.storagePath,
      createdAt: attachment.createdAt,
    };
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<TicketAttachment | null> {
    const attachment = await prisma.ticketAttachment.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!attachment) {
      return null;
    }

    return {
      id: attachment.id,
      tenantId: attachment.tenantId,
      ticketId: attachment.ticketId,
      uploadedById: attachment.uploadedById,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storagePath: attachment.storagePath,
      createdAt: attachment.createdAt,
    };
  }

  async listByTicketId(
    ticketId: string,
    tenantId: string,
  ): Promise<TicketAttachmentWithUploader[]> {
    const attachments = await prisma.ticketAttachment.findMany({
      where: {
        ticketId,
        tenantId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return attachments.map((attachment) => ({
      id: attachment.id,
      tenantId: attachment.tenantId,
      ticketId: attachment.ticketId,
      uploadedById: attachment.uploadedById,
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      storagePath: attachment.storagePath,
      createdAt: attachment.createdAt,
      uploadedBy: {
        id: attachment.uploadedBy.id,
        name: attachment.uploadedBy.name,
        email: attachment.uploadedBy.email,
      },
    }));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.ticketAttachment.deleteMany({
      where: {
        id,
        tenantId,
      },
    });
  }
}

export const ticketAttachmentsRepository = new TicketAttachmentsRepository();
