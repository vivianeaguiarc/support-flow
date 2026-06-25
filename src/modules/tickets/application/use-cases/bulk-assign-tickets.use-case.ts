import { prisma } from '../../../../shared/database/prisma.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { createTicketAssignedEvent } from '../../../../shared/events/ticket/ticket-events.js';
import { canBeAssignedTickets } from '../../../../shared/security/rbac.js';
import {
  OutboxService,
  outboxService,
} from '../../../outbox/application/services/outbox.service.js';
import {
  OutboxRelayService,
  outboxRelayService,
} from '../../../outbox/application/services/outbox-relay.service.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import {
  assertTicketAssignable,
  resolveAssignmentHistoryEvent,
} from '../../domain/assign-ticket.rules.js';
import {
  assertAllTicketsPresent,
  BULK_TICKET_OPERATION,
  type BulkTicketOperationResult,
  type Ticket,
  type TicketStatus,
} from '../../domain/index.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { BulkAssignTicketsInput } from '../inputs/ticket-use-case.inputs.js';

export class BulkAssignTicketsUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
    private readonly outbox: OutboxService = outboxService,
    private readonly outboxRelay: OutboxRelayService = outboxRelayService,
  ) {}

  async execute(
    input: BulkAssignTicketsInput,
  ): Promise<BulkTicketOperationResult> {
    const tickets = await this.ticketsRepository.findManyByIdsAndTenant(
      input.ticketIds,
      input.tenantId,
    );

    assertAllTicketsPresent(input.ticketIds, tickets);

    for (const ticket of tickets) {
      this.assertTicketAssignable(ticket);
    }

    await this.ensureAgent(input.assignedToId, input.tenantId);

    const reasonMetadata = input.reason ? { reason: input.reason } : undefined;

    const updatedTickets = await prisma.$transaction(async (tx) => {
      const results: Ticket[] = [];

      for (const ticket of tickets) {
        const previousAssigneeId = ticket.assignedToId;

        const assignedTicket = await this.ticketsRepository.assignTo(
          ticket.id,
          input.assignedToId,
          tx,
        );

        await this.ticketHistoryRepository.create(
          {
            tenantId: input.tenantId,
            ticketId: ticket.id,
            event: resolveAssignmentHistoryEvent(previousAssigneeId),
            field: 'assignedToId',
            oldValue: previousAssigneeId ?? undefined,
            newValue: input.assignedToId,
            changedById: input.changedById,
            metadata: reasonMetadata,
          },
          tx,
        );

        await this.outbox.enqueueInTransaction(
          createTicketAssignedEvent({
            tenantId: input.tenantId,
            ticket: assignedTicket,
            assigneeId: input.assignedToId,
            previousAssigneeId,
            actorId: input.changedById,
            isReassignment: Boolean(previousAssigneeId),
          }),
          tx,
        );

        results.push(assignedTicket);
      }

      return results;
    });

    await this.outboxRelay.scheduleRelay();

    return {
      totalRequested: input.ticketIds.length,
      totalUpdated: updatedTickets.length,
      updatedTicketIds: updatedTickets.map((ticket) => ticket.id),
      operation: BULK_TICKET_OPERATION.ASSIGN,
      message: 'Tickets assigned successfully.',
    };
  }

  /**
   * Mirrors the single-ticket assignment rule but raises HTTP 409 (Conflict)
   * so any non-assignable ticket aborts the whole atomic operation.
   */
  private assertTicketAssignable(ticket: Ticket): void {
    try {
      assertTicketAssignable(ticket.status as TicketStatus);
    } catch (error) {
      if (error instanceof AppError) {
        throw new AppError(error.message, 409, true, undefined, {
          ticketId: ticket.id,
        });
      }

      throw error;
    }
  }

  private async ensureAgent(agentId: string, tenantId: string): Promise<void> {
    const agent = await this.usersRepository.findById(agentId, tenantId);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.tenantId !== tenantId) {
      throw new AppError('Invalid tenant for agent', 403);
    }

    if (!canBeAssignedTickets(agent.role)) {
      throw new AppError('User must have an assignable staff role', 400);
    }
  }
}

export const bulkAssignTicketsUseCase = new BulkAssignTicketsUseCase();
