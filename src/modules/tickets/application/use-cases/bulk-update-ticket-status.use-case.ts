import { prisma } from '../../../../shared/database/prisma.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import {
  createTicketClosedEvent,
  createTicketResolvedEvent,
  createTicketStatusChangedEvent,
} from '../../../../shared/events/ticket/ticket-events.js';
import {
  OutboxService,
  outboxService,
} from '../../../outbox/application/services/outbox.service.js';
import {
  OutboxRelayService,
  outboxRelayService,
} from '../../../outbox/application/services/outbox-relay.service.js';
import {
  assertAllTicketsPresent,
  BULK_TICKET_OPERATION,
  type BulkTicketOperationResult,
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
import type { BulkUpdateTicketStatusInput } from '../inputs/ticket-use-case.inputs.js';

export class BulkUpdateTicketStatusUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly outbox: OutboxService = outboxService,
    private readonly outboxRelay: OutboxRelayService = outboxRelayService,
  ) {}

  async execute(
    input: BulkUpdateTicketStatusInput,
  ): Promise<BulkTicketOperationResult> {
    const tickets = await this.ticketsRepository.findManyByIdsAndTenant(
      input.ticketIds,
      input.tenantId,
    );

    assertAllTicketsPresent(input.ticketIds, tickets);

    for (const ticket of tickets) {
      this.assertValidStatusChange(ticket, input.status);
    }

    const reasonMetadata = input.reason ? { reason: input.reason } : undefined;

    const updatedTickets = await prisma.$transaction(async (tx) => {
      const results: Ticket[] = [];

      for (const ticket of tickets) {
        const previousStatus = ticket.status as TicketStatus;

        const nextTicket = await this.ticketsRepository.updateStatus(
          ticket.id,
          input.status,
          tx,
        );

        await this.ticketHistoryRepository.create(
          {
            tenantId: input.tenantId,
            ticketId: ticket.id,
            event: TicketHistoryEvent.STATUS_CHANGED,
            field: 'status',
            oldValue: previousStatus,
            newValue: input.status,
            changedById: input.changedById,
            metadata: reasonMetadata,
          },
          tx,
        );

        await this.outbox.enqueueInTransaction(
          createTicketStatusChangedEvent({
            tenantId: input.tenantId,
            ticket: nextTicket,
            previousStatus,
            newStatus: input.status,
            actorId: input.changedById,
          }),
          tx,
        );

        if (input.status === TicketStatus.RESOLVED) {
          await this.outbox.enqueueInTransaction(
            createTicketResolvedEvent({
              tenantId: input.tenantId,
              ticket: nextTicket,
              previousStatus,
              actorId: input.changedById,
            }),
            tx,
          );
        }

        if (input.status === TicketStatus.CLOSED) {
          await this.outbox.enqueueInTransaction(
            createTicketClosedEvent({
              tenantId: input.tenantId,
              ticket: nextTicket,
              previousStatus,
              actorId: input.changedById,
            }),
            tx,
          );
        }

        results.push(nextTicket);
      }

      return results;
    });

    await this.outboxRelay.scheduleRelay();

    return {
      totalRequested: input.ticketIds.length,
      totalUpdated: updatedTickets.length,
      updatedTicketIds: updatedTickets.map((ticket) => ticket.id),
      operation: BULK_TICKET_OPERATION.STATUS_UPDATE,
      message: 'Tickets updated successfully.',
    };
  }

  /**
   * Reuses the exact same domain rules as the single-ticket endpoint, but
   * surfaces conflicts as HTTP 409 (Conflict) because in a bulk context a
   * single offending ticket aborts the whole atomic operation.
   */
  private assertValidStatusChange(ticket: Ticket, status: TicketStatus): void {
    try {
      assertValidTicketStatusTransition(ticket.status as TicketStatus, status);
      assertAssigneeRequiredForInProgress(ticket, status);
    } catch (error) {
      if (error instanceof AppError) {
        throw new AppError(error.message, 409, true, undefined, {
          ticketId: ticket.id,
        });
      }

      throw error;
    }
  }
}

export const bulkUpdateTicketStatusUseCase =
  new BulkUpdateTicketStatusUseCase();
