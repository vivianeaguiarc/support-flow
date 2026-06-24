import {
  type NotificationService,
  notificationService as defaultEmailNotificationService,
} from '../../../email/application/services/notification.service.js';
import { EmailNotificationEvent } from '../../../email/domain/email-notification-event.js';
import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import { TicketStatus } from '../../../tickets/domain/ticket-enums.js';
import { NotificationType } from '../../domain/notification-types.js';
import {
  type CreateNotificationUseCase,
  createNotificationUseCase,
} from '../use-cases/create-notification.use-case.js';

export class NotificationEventService {
  constructor(
    private readonly createNotification: CreateNotificationUseCase = createNotificationUseCase,
    private readonly emailNotificationService: NotificationService = defaultEmailNotificationService,
  ) {}

  async notifyTicketCreated(
    ticket: Ticket,
    _customerId: string,
  ): Promise<void> {
    if (!ticket.assignedToId) {
      return;
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_CREATED,
      title: 'Novo chamado criado',
      message: `Um novo chamado "${ticket.title}" foi criado.`,
    });

    await this.emailNotificationService.sendTicketNotification({
      event: EmailNotificationEvent.TICKET_CREATED,
      ticket,
      recipientId: ticket.assignedToId,
    });
  }

  async notifyTicketAssigned(
    ticket: Ticket,
    assignedToId: string,
  ): Promise<void> {
    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_ASSIGNED,
      title: 'Chamado atribuído a você',
      message: `O chamado "${ticket.title}" foi atribuído a você.`,
    });

    await this.emailNotificationService.sendTicketNotification({
      event: EmailNotificationEvent.TICKET_ASSIGNED,
      ticket,
      recipientId: assignedToId,
    });
  }

  async notifyTicketReassigned(
    ticket: Ticket,
    assignedToId: string,
  ): Promise<void> {
    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_ASSIGNED,
      title: 'Chamado reatribuído para você',
      message: `O chamado "${ticket.title}" foi reatribuído para você.`,
    });

    await this.emailNotificationService.sendTicketNotification({
      event: EmailNotificationEvent.TICKET_REASSIGNED,
      ticket,
      recipientId: assignedToId,
    });
  }

  async notifyTicketStatusChanged(
    ticket: Ticket,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    if (!ticket.assignedToId) {
      return;
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: 'Status do chamado alterado',
      message: `O status do chamado "${ticket.title}" foi alterado de ${oldStatus} para ${newStatus}.`,
    });

    const emailEvent = this.resolveStatusEmailEvent(newStatus);

    await this.emailNotificationService.sendTicketNotification({
      event: emailEvent,
      ticket,
      recipientId: ticket.assignedToId,
      context: {
        oldStatus,
        newStatus,
      },
    });
  }

  async notifyCommentAdded(
    ticket: Ticket,
    authorId: string,
    isInternal: boolean,
  ): Promise<void> {
    if (!ticket.assignedToId || ticket.assignedToId === authorId) {
      return;
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_COMMENT_ADDED,
      title: isInternal
        ? 'Novo comentário interno'
        : 'Novo comentário no chamado',
      message: `Um novo comentário foi adicionado ao chamado "${ticket.title}".`,
    });
  }

  async notifyAttachmentAdded(
    ticket: Ticket,
    uploadedById: string,
    fileName: string,
  ): Promise<void> {
    if (!ticket.assignedToId || ticket.assignedToId === uploadedById) {
      return;
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_ATTACHMENT_ADDED,
      title: 'Novo anexo adicionado',
      message: `Um arquivo "${fileName}" foi anexado ao chamado "${ticket.title}".`,
    });
  }

  async notifySlaWarning(
    ticket: Ticket,
    context?: { hoursRemaining?: number },
  ): Promise<void> {
    if (!ticket.assignedToId) {
      return;
    }

    const hoursRemaining = context?.hoursRemaining;
    const hoursText =
      hoursRemaining !== undefined
        ? ` vencerá em ${hoursRemaining} hora(s)`
        : ' está próximo do vencimento do SLA';

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.SLA_WARNING,
      title: 'SLA próximo do vencimento',
      message: `O chamado "${ticket.title}"${hoursText}.`,
    });

    await this.emailNotificationService.sendTicketNotification({
      event: EmailNotificationEvent.SLA_WARNING,
      ticket,
      recipientId: ticket.assignedToId,
      context: { hoursRemaining },
    });
  }

  async notifySlaExpired(
    ticket: Ticket,
    context?: { hoursOverdue?: number },
  ): Promise<void> {
    if (!ticket.assignedToId) {
      return;
    }

    const hoursOverdue = context?.hoursOverdue;
    const hoursText =
      hoursOverdue !== undefined
        ? ` venceu há ${hoursOverdue} hora(s)`
        : ' venceu';

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.SLA_EXPIRED,
      title: 'SLA vencido',
      message: `O SLA do chamado "${ticket.title}"${hoursText}.`,
    });

    await this.emailNotificationService.sendTicketNotification({
      event: EmailNotificationEvent.SLA_BREACHED,
      ticket,
      recipientId: ticket.assignedToId,
      context: { hoursOverdue },
    });
  }

  async notifyTicketEscalated(
    ticket: Ticket,
    previousStatus: string,
  ): Promise<void> {
    if (!ticket.assignedToId) {
      return;
    }

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: 'Chamado escalado automaticamente',
      message: `O chamado "${ticket.title}" (${ticket.protocol}) foi escalado automaticamente devido ao vencimento do SLA. Status anterior: ${previousStatus}.`,
    });
  }

  private resolveStatusEmailEvent(newStatus: string): EmailNotificationEvent {
    if (newStatus === TicketStatus.RESOLVED) {
      return EmailNotificationEvent.TICKET_RESOLVED;
    }

    if (newStatus === TicketStatus.CLOSED) {
      return EmailNotificationEvent.TICKET_CLOSED;
    }

    return EmailNotificationEvent.TICKET_STATUS_CHANGED;
  }
}

export const notificationEventService = new NotificationEventService();
