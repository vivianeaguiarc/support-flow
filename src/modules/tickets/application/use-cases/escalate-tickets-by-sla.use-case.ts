import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import { TicketHistoryEvent, TicketStatus } from '../../domain/ticket-enums.js';
import {
  type TicketHistoryRepository,
  ticketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  type TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type EscalateTicketsBySlaResult = {
  ticketsChecked: number;
  ticketsEscalated: number;
};

const ELIGIBLE_STATUSES_FOR_ESCALATION = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
];

export class EscalateTicketsBySlaUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly historyRepo: TicketHistoryRepository = ticketHistoryRepository,
    private readonly notificationService: NotificationEventService = notificationEventService,
  ) {}

  async execute(): Promise<EscalateTicketsBySlaResult> {
    const now = new Date();

    const tickets = await this.ticketsRepo.findAll({
      status: ELIGIBLE_STATUSES_FOR_ESCALATION,
      hasSla: true,
    });

    const overdueTickets = tickets.filter(
      (ticket) => ticket.slaDueAt && ticket.slaDueAt < now,
    );

    let ticketsEscalated = 0;

    for (const ticket of overdueTickets) {
      const escalated = await this.escalateTicket(ticket);
      if (escalated) {
        ticketsEscalated++;
      }
    }

    return {
      ticketsChecked: overdueTickets.length,
      ticketsEscalated,
    };
  }

  private async escalateTicket(ticket: Ticket): Promise<boolean> {
    try {
      const updatedTicket = await this.ticketsRepo.updateStatus(
        ticket.id,
        TicketStatus.ESCALATED,
      );

      await this.historyRepo.create({
        tenantId: ticket.tenantId,
        ticketId: ticket.id,
        event: TicketHistoryEvent.TICKET_ESCALATED,
        field: 'status',
        oldValue: ticket.status,
        newValue: TicketStatus.ESCALATED,
        changedById: null,
      });

      await this.notificationService.notifyTicketEscalated(
        updatedTicket,
        ticket.status,
      );

      return true;
    } catch (error) {
      console.error(
        `[Escalation] Failed to escalate ticket ${ticket.id}:`,
        error,
      );
      return false;
    }
  }
}

export const escalateTicketsBySlaUseCase = new EscalateTicketsBySlaUseCase();
