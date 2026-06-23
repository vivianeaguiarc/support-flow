import { prisma } from '../../../../shared/database/prisma.js';
import type {
  TicketComment,
  TicketCommentWithAuthor,
} from '../../domain/ticket-comment.js';
import { CommentVisibility } from '../../domain/ticket-enums.js';

export type CreateCommentData = {
  tenantId: string;
  ticketId: string;
  authorId: string;
  content: string;
};

export class TicketCommentsRepository {
  async create(data: CreateCommentData): Promise<TicketComment> {
    const comment = await prisma.ticketComment.create({
      data: {
        ...data,
        visibility: CommentVisibility.INTERNAL,
      },
    });

    return {
      id: comment.id,
      tenantId: comment.tenantId,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      content: comment.content,
      visibility: comment.visibility as CommentVisibility,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async listByTicketId(
    ticketId: string,
    tenantId: string,
  ): Promise<TicketCommentWithAuthor[]> {
    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId,
        tenantId,
      },
      include: {
        author: {
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

    return comments.map((comment) => ({
      id: comment.id,
      tenantId: comment.tenantId,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      content: comment.content,
      visibility: comment.visibility as CommentVisibility,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        name: comment.author.name,
        email: comment.author.email,
      },
    }));
  }
}

export const ticketCommentsRepository = new TicketCommentsRepository();
