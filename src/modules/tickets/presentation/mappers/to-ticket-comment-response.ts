import type {
  TicketComment,
  TicketCommentWithAuthor,
} from '../../domain/ticket-comment.js';
import type { CommentVisibility } from '../../domain/ticket-enums.js';

export type TicketCommentAuthorResponse = {
  id: string;
  name: string;
  email: string;
};

export type TicketCommentResponse = {
  id: string;
  ticketId: string;
  tenantId: string;
  authorId: string;
  content: string;
  visibility: CommentVisibility;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketCommentWithAuthorResponse = TicketCommentResponse & {
  author: TicketCommentAuthorResponse;
};

export function toTicketCommentResponse(
  comment: TicketComment,
): TicketCommentResponse {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    tenantId: comment.tenantId,
    authorId: comment.authorId,
    content: comment.content,
    visibility: comment.visibility,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export function toTicketCommentWithAuthorResponse(
  comment: TicketCommentWithAuthor,
): TicketCommentWithAuthorResponse {
  return {
    ...toTicketCommentResponse(comment),
    author: {
      id: comment.author.id,
      name: comment.author.name,
      email: comment.author.email,
    },
  };
}
