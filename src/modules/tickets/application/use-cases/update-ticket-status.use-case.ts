import {
  type EventBus,
  eventBus as defaultEventBus,
} from '../../../../shared/events/event-bus.js';
import {
  createTicketClosedEvent,
  createTicketResolvedEvent,
  createTicketStatusChangedEvent,
} from '../../../../shared/events/ticket/ticket-events.js';
import {
  type Ticket,
  TicketHistoryEvent,
  TicketStatus,
} from '../../domain/index.js';
import { assertAssigneeRequiredForInProgress } from '../../domain/ticket-in-progress.rules.js';
import { assertValidTicketStatusTransition } from '../../domain/ticket-status-transitions.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { UpdateTicketStatusInput } from '../inputs/ticket-use-case.inputs.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export class UpdateTicketStatusUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
    private readonly eventBus: EventBus = defaultEventBus,
  ) {}

  async execute(input: UpdateTicketStatusInput): Promise<Ticket> {
    const ticket = await this.findTicket.execute({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
    });

    assertValidTicketStatusTransition(ticket.status, input.status);
    assertAssigneeRequiredForInProgress(ticket, input.status);

    const updatedTicket = await this.ticketsRepository.updateStatus(
      ticket.id,
      input.status,
    );

    await this.ticketHistoryRepository.create({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.STATUS_CHANGED,
      field: 'status',
      oldValue: ticket.status,
      newValue: input.status,
      changedById: input.changedById,
    });

    await this.eventBus.publish(
      createTicketStatusChangedEvent({
        tenantId: input.tenantId,
        ticket: updatedTicket,
        previousStatus: ticket.status,
        newStatus: input.status,
        actorId: input.changedById,
      }),
    );

    if (input.status === TicketStatus.RESOLVED) {
      await this.eventBus.publish(
        createTicketResolvedEvent({
          tenantId: input.tenantId,
          ticket: updatedTicket,
          previousStatus: ticket.status,
          actorId: input.changedById,
        }),
      );
    }

    if (input.status === TicketStatus.CLOSED) {
      await this.eventBus.publish(
        createTicketClosedEvent({
          tenantId: input.tenantId,
          ticket: updatedTicket,
          previousStatus: ticket.status,
          actorId: input.changedById,
        }),
      );
    }

    return updatedTicket;
  }
}

export const updateTicketStatusUseCase = new UpdateTicketStatusUseCase();
