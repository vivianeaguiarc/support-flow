import {
  type CreateNotificationUseCase,
  createNotificationUseCase,
} from '../../../notifications/application/use-cases/create-notification.use-case.js';
import { NotificationType } from '../../../notifications/domain/notification-types.js';
import {
  type NotificationsRepository,
  notificationsRepository,
} from '../../../notifications/infrastructure/repositories/notifications.repository.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketStatus } from '../../domain/ticket-enums.js';
import {
  calculateSlaHoursOverdue,
  calculateSlaHoursRemaining,
  isSlaBreached,
  isSlaWarning,
} from '../../domain/ticket-sla-status.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type MonitorTicketSlaResult = {
  ticketsChecked: number;
  warningsCreated: number;
  expiredNotificationsCreated: number;
};

const ELIGIBLE_STATUSES = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_CUSTOMER,
  TicketStatus.ESCALATED,
];

export class MonitorTicketSlaUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly notificationsRepo: NotificationsRepository = notificationsRepository,
    private readonly createNotification: CreateNotificationUseCase = createNotificationUseCase,
  ) {}

  async execute(): Promise<MonitorTicketSlaResult> {
    const now = new Date();

    const tickets = await this.ticketsRepo.findAll({
      status: ELIGIBLE_STATUSES,
      hasSla: true,
    });

    let warningsCreated = 0;
    let expiredNotificationsCreated = 0;

    for (const ticket of tickets) {
      if (!ticket.slaDueAt) {
        continue;
      }

      if (isSlaBreached(ticket.slaDueAt, now)) {
        const created = await this.createExpiredNotification(ticket, now);
        if (created) {
          expiredNotificationsCreated++;
        }
      } else if (isSlaWarning(ticket.slaDueAt, now)) {
        const created = await this.createWarningNotification(ticket, now);
        if (created) {
          warningsCreated++;
        }
      }
    }

    return {
      ticketsChecked: tickets.length,
      warningsCreated,
      expiredNotificationsCreated,
    };
  }

  private async createWarningNotification(
    ticket: Ticket,
    now: Date,
  ): Promise<boolean> {
    if (!ticket.assignedToId) {
      return false;
    }

    const alreadyNotified = await this.hasExistingNotification(
      ticket.id,
      NotificationType.SLA_WARNING,
    );

    if (alreadyNotified) {
      return false;
    }

    const hoursRemaining = calculateSlaHoursRemaining(ticket.slaDueAt!, now);

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.SLA_WARNING,
      title: 'SLA próximo do vencimento',
      message: `O chamado "${ticket.title}" (${ticket.protocol}) vencerá em ${hoursRemaining}h.`,
    });

    return true;
  }

  private async createExpiredNotification(
    ticket: Ticket,
    now: Date,
  ): Promise<boolean> {
    if (!ticket.assignedToId) {
      return false;
    }

    const alreadyNotified = await this.hasExistingNotification(
      ticket.id,
      NotificationType.SLA_EXPIRED,
    );

    if (alreadyNotified) {
      return false;
    }

    const hoursOverdue = calculateSlaHoursOverdue(ticket.slaDueAt!, now);

    await this.createNotification.execute({
      tenantId: ticket.tenantId,
      recipientId: ticket.assignedToId,
      ticketId: ticket.id,
      type: NotificationType.SLA_EXPIRED,
      title: 'SLA vencido',
      message: `O SLA do chamado "${ticket.title}" (${ticket.protocol}) venceu há ${hoursOverdue}h.`,
    });

    return true;
  }

  private async hasExistingNotification(
    ticketId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const count = await this.notificationsRepo.countByTicketAndType(
      ticketId,
      type,
    );
    return count > 0;
  }
}

export const monitorTicketSlaUseCase = new MonitorTicketSlaUseCase();
