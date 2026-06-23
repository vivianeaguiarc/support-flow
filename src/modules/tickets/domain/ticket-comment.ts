import type { CommentVisibility } from './ticket-enums.js';

export type TicketComment = {
  id: string;
  tenantId: string;
  ticketId: string;
  authorId: string;
  content: string;
  visibility: CommentVisibility;
  createdAt: Date;
  updatedAt: Date;
};

export type TicketCommentWithAuthor = TicketComment & {
  author: {
    id: string;
    name: string;
    email: string;
  };
};
