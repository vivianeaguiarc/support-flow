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
import { type Ticket } from '../../domain/index.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { AssignTicketInput } from '../inputs/ticket-use-case.inputs.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export class AssignTicketUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
    private readonly outbox: OutboxService = outboxService,
    private readonly outboxRelay: OutboxRelayService = outboxRelayService,
  ) {}

  async execute(input: AssignTicketInput): Promise<Ticket> {
    const ticket = await this.findTicket.execute({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
    });

    assertTicketAssignable(ticket.status);

    await this.ensureAgent(input.assignedToId, input.tenantId);

    const updatedTicket = await prisma.$transaction(async (tx) => {
      const assignedTicket = await this.ticketsRepository.assignTo(
        ticket.id,
        input.assignedToId,
        tx,
      );

      await this.ticketHistoryRepository.create(
        {
          tenantId: input.tenantId,
          ticketId: ticket.id,
          event: resolveAssignmentHistoryEvent(ticket.assignedToId),
          field: 'assignedToId',
          oldValue: ticket.assignedToId ?? undefined,
          newValue: input.assignedToId,
          changedById: input.changedById,
        },
        tx,
      );

      await this.outbox.enqueueInTransaction(
        createTicketAssignedEvent({
          tenantId: input.tenantId,
          ticket: assignedTicket,
          assigneeId: input.assignedToId,
          previousAssigneeId: ticket.assignedToId,
          actorId: input.changedById,
          isReassignment: Boolean(ticket.assignedToId),
        }),
        tx,
      );

      return assignedTicket;
    });

    await this.outboxRelay.scheduleRelay();

    return updatedTicket;
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

export const assignTicketUseCase = new AssignTicketUseCase();
