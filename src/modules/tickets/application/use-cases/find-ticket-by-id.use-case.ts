import type { Ticket } from '@prisma/client';

import { AppError } from '../../../../shared/errors/app-error.js';
import {
  TicketsRepository,
  ticketsRepository as defaultTicketsRepository,
} from '../../repositories/tickets.repository.js';
import type { FindTicketByIdInput } from '../inputs/ticket-use-case.inputs.js';

export class FindTicketByIdUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
  ) {}

  async execute(input: FindTicketByIdInput): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findByIdAndTenant(
      input.ticketId,
      input.tenantId,
    );

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    return ticket;
  }
}

export const findTicketByIdUseCase = new FindTicketByIdUseCase();
