import { assertTicketForTenant } from '../../../../shared/security/tenant-access.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import type { TicketComment } from '../../domain/ticket-comment.js';
import {
  CommentVisibility,
  TicketHistoryEvent,
} from '../../domain/ticket-enums.js';
import {
  type TicketCommentsRepository,
  ticketCommentsRepository,
} from '../../infrastructure/repositories/ticket-comments.repository.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type CreateTicketCommentInput = {
  ticketId: string;
  tenantId: string;
  authorId: string;
  content: string;
  visibility: CommentVisibility;
  /**
   * Whether the author is a staff User (vs. a Customer). Ticket history records
   * reference a User via `changedById`, so audit entries are only created for
   * staff-authored comments.
   */
  authorIsStaff: boolean;
};

export class CreateTicketCommentUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly commentsRepo: TicketCommentsRepository = ticketCommentsRepository,
    private readonly historyRepo: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly notificationService: NotificationEventService = notificationEventService,
  ) {}

  async execute(input: CreateTicketCommentInput): Promise<TicketComment> {
    const ticket = assertTicketForTenant(
      await this.ticketsRepo.findById(input.ticketId),
      input.tenantId,
    );

    const comment = await this.commentsRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      authorId: input.authorId,
      content: input.content,
      visibility: input.visibility,
    });

    if (input.authorIsStaff) {
      await this.historyRepo.create({
        ticketId: input.ticketId,
        tenantId: input.tenantId,
        event: TicketHistoryEvent.COMMENT_ADDED,
        changedById: input.authorId,
        field: 'comment',
        newValue: `Comment added by user ${input.authorId}`,
        metadata: {
          commentId: comment.id,
          visibility: comment.visibility,
        },
      });
    }

    await this.notificationService.notifyCommentAdded(
      ticket,
      input.authorId,
      comment.visibility === CommentVisibility.INTERNAL,
    );

    return comment;
  }
}

export const createTicketCommentUseCase = new CreateTicketCommentUseCase();
