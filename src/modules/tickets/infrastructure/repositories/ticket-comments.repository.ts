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
  visibility: CommentVisibility;
};

type CommentAuthor = {
  id: string;
  name: string;
  email: string;
};

export class TicketCommentsRepository {
  async create(data: CreateCommentData): Promise<TicketComment> {
    const comment = await prisma.ticketComment.create({
      data: {
        tenantId: data.tenantId,
        ticketId: data.ticketId,
        authorId: data.authorId,
        content: data.content,
        visibility: data.visibility,
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
    visibility?: CommentVisibility,
  ): Promise<TicketCommentWithAuthor[]> {
    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId,
        tenantId,
        ...(visibility ? { visibility } : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (comments.length === 0) {
      return [];
    }

    const authorMap = await this.resolveAuthors(
      comments.map((comment) => comment.authorId),
    );

    return comments.map((comment) => ({
      id: comment.id,
      tenantId: comment.tenantId,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      content: comment.content,
      visibility: comment.visibility as CommentVisibility,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: authorMap.get(comment.authorId) ?? {
        id: comment.authorId,
        name: 'Desconhecido',
        email: '',
      },
    }));
  }

  /**
   * authorId is polymorphic: it may point to a staff User or a Customer. We
   * resolve only non-sensitive fields (id, name, email) from whichever table
   * owns the id, preferring the User table on the unlikely event of collision.
   */
  private async resolveAuthors(
    authorIds: string[],
  ): Promise<Map<string, CommentAuthor>> {
    const uniqueIds = [...new Set(authorIds)];

    const [users, customers] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, name: true, email: true },
      }),
      prisma.customer.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const authorMap = new Map<string, CommentAuthor>();

    for (const customer of customers) {
      authorMap.set(customer.id, customer);
    }

    for (const user of users) {
      authorMap.set(user.id, user);
    }

    return authorMap;
  }
}

export const ticketCommentsRepository = new TicketCommentsRepository();
