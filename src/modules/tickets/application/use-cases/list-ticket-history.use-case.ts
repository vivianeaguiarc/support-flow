import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../repositories/ticket-history.repository.js';
import type { FindTicketByIdInput } from '../inputs/ticket-use-case.inputs.js';
import {
  type TicketHistoryResult,
  toTicketHistoryResult,
} from '../mappers/to-ticket-history-response.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export class ListTicketHistoryUseCase {
  constructor(
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
  ) {}

  async forTicket(
    ticketId: string,
    tenantId: string,
  ): Promise<TicketHistoryResult> {
    const records = await this.ticketHistoryRepository.listByTicketIdAndTenant(
      ticketId,
      tenantId,
    );

    return toTicketHistoryResult(ticketId, records);
  }

  async execute(input: FindTicketByIdInput): Promise<TicketHistoryResult> {
    await this.findTicket.execute(input);
    return this.forTicket(input.ticketId, input.tenantId);
  }
}

export const listTicketHistoryUseCase = new ListTicketHistoryUseCase();
