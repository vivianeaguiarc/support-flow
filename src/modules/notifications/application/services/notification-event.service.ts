import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import { NotificationType } from '../../domain/notification-types.js';
import {
  type CreateNotificationUseCase,
  createNotificationUseCase,
} from '../use-cases/create-notification.use-case.js';

export class NotificationEventService {
  constructor(
    private readonly createNotification: CreateNotificationUseCase = createNotificationUseCase,
  ) {}

  async notifyTicketCreated(
    ticket: Ticket,
    _customerId: string,
  ): Promise<void> {
    const recipientIds: string[] = [];

    if (ticket.assignedToId) {
      recipientIds.push(ticket.assignedToId);
    }

    for (const recipientId of recipientIds) {
      await this.createNotification.execute({
        tenantId: ticket.tenantId,
        recipientId,
        ticketId: ticket.id,
        type: NotificationType.TICKET_CREATED,
        title: 'Novo chamado criado',
        message: `Um novo chamado "${ticket.title}" foi criado.`,
      });
    }
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

  async notifySlaWarning(ticket: Ticket): Promise<void> {
    const recipientIds: string[] = [];

    if (ticket.assignedToId) {
      recipientIds.push(ticket.assignedToId);
    }

    for (const recipientId of recipientIds) {
      await this.createNotification.execute({
        tenantId: ticket.tenantId,
        recipientId,
        ticketId: ticket.id,
        type: NotificationType.SLA_WARNING,
        title: 'SLA próximo do vencimento',
        message: `O chamado "${ticket.title}" está próximo do vencimento do SLA.`,
      });
    }
  }

  async notifySlaExpired(ticket: Ticket): Promise<void> {
    const recipientIds: string[] = [];

    if (ticket.assignedToId) {
      recipientIds.push(ticket.assignedToId);
    }

    for (const recipientId of recipientIds) {
      await this.createNotification.execute({
        tenantId: ticket.tenantId,
        recipientId,
        ticketId: ticket.id,
        type: NotificationType.SLA_EXPIRED,
        title: 'SLA vencido',
        message: `O SLA do chamado "${ticket.title}" venceu.`,
      });
    }
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
}

export const notificationEventService = new NotificationEventService();
