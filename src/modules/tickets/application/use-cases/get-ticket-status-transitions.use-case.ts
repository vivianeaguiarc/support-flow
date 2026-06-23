import type { TicketStatus } from '@prisma/client';

import { getAllowedTicketStatusTransitions } from '../../domain/ticket-status-transitions.js';
import type { FindTicketByIdInput } from '../inputs/ticket-use-case.inputs.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export type TicketStatusTransitionsResult = {
  currentStatus: TicketStatus;
  allowedTransitions: TicketStatus[];
};

export class GetTicketStatusTransitionsUseCase {
  constructor(
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
  ) {}

  forStatus(status: TicketStatus): TicketStatusTransitionsResult {
    return {
      currentStatus: status,
      allowedTransitions: getAllowedTicketStatusTransitions(status),
    };
  }

  async execute(
    input: FindTicketByIdInput,
  ): Promise<TicketStatusTransitionsResult> {
    const ticket = await this.findTicket.execute(input);
    return this.forStatus(ticket.status);
  }
}

export const getTicketStatusTransitionsUseCase =
  new GetTicketStatusTransitionsUseCase();
