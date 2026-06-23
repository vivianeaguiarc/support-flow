import { assertTicketForTenant } from '../../../../shared/security/tenant-access.js';
import type { Ticket } from '../../domain/ticket.entity.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';
import type { FindTicketByIdInput } from '../inputs/ticket-use-case.inputs.js';

export class FindTicketByIdUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(input: FindTicketByIdInput): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findById(input.ticketId);

    return assertTicketForTenant(ticket, input.tenantId);
  }
}

export const findTicketByIdUseCase = new FindTicketByIdUseCase();
