import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  canViewFullTicketHistory,
  isPublicTicketHistoryEvent,
} from '../../domain/ticket-history-policy.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
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
    authUser: AuthenticatedUser,
  ): Promise<TicketHistoryResult> {
    const records = await this.ticketHistoryRepository.listByTicketIdAndTenant(
      ticketId,
      tenantId,
    );

    const visibleRecords = canViewFullTicketHistory(authUser.role)
      ? records
      : records.filter((record) =>
          isPublicTicketHistoryEvent(record.event as TicketHistoryEvent),
        );

    return toTicketHistoryResult(ticketId, visibleRecords);
  }

  async execute(
    input: FindTicketByIdInput,
    authUser: AuthenticatedUser,
  ): Promise<TicketHistoryResult> {
    await this.findTicket.execute(input);
    return this.forTicket(input.ticketId, input.tenantId, authUser);
  }
}

export const listTicketHistoryUseCase = new ListTicketHistoryUseCase();
