import { AppError } from '../../../../shared/errors/app-error.js';
import { UserRole } from '../../../../shared/types/user-role.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import { type Ticket, TicketHistoryEvent } from '../../domain/index.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../repositories/tickets.repository.js';
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
  ) {}

  async execute(input: AssignTicketInput): Promise<Ticket> {
    const ticket = await this.findTicket.execute({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
    });

    await this.ensureAgent(input.assignedToId, input.tenantId);

    const updatedTicket = await this.ticketsRepository.assignTo(
      ticket.id,
      input.assignedToId,
    );

    await this.ticketHistoryRepository.create({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.ASSIGNED,
      field: 'assignedToId',
      oldValue: ticket.assignedToId ?? undefined,
      newValue: input.assignedToId,
      changedById: input.changedById,
    });

    return updatedTicket;
  }

  private async ensureAgent(agentId: string, tenantId: string): Promise<void> {
    const agent = await this.usersRepository.findById(agentId);

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (agent.tenantId !== tenantId) {
      throw new AppError('Invalid tenant for agent', 403);
    }

    if (agent.role !== UserRole.AGENT && agent.role !== UserRole.ADMIN) {
      throw new AppError('User must have AGENT role', 400);
    }
  }
}

export const assignTicketUseCase = new AssignTicketUseCase();
