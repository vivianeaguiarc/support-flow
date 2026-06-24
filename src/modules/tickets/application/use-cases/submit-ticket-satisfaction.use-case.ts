import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import {
  type EventBus,
  eventBus as defaultEventBus,
} from '../../../../shared/events/event-bus.js';
import { createCsatSubmittedEvent } from '../../../../shared/events/ticket/ticket-events.js';
import { assertFeatureEnabled } from '../../../../shared/feature-flags/require-feature-flag.js';
import { assertTicketForTenant } from '../../../../shared/security/tenant-access.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import { FeatureFlagKey } from '../../../feature-flags/domain/feature-flag-keys.js';
import { TicketHistoryEvent } from '../../domain/ticket-enums.js';
import {
  assertCanSubmitTicketSatisfaction,
  assertTicketHasNoSatisfactionSurvey,
} from '../../domain/ticket-satisfaction.rules.js';
import type { TicketSatisfactionSurvey } from '../../domain/ticket-satisfaction-survey.entity.js';
import {
  TicketHistoryRepository,
  ticketHistoryRepository as defaultTicketHistoryRepository,
} from '../../infrastructure/repositories/ticket-history.repository.js';
import {
  TicketSatisfactionRepository,
  ticketSatisfactionRepository as defaultTicketSatisfactionRepository,
} from '../../infrastructure/repositories/ticket-satisfaction.repository.js';
import {
  TicketsRepository,
  ticketsRepository,
} from '../../infrastructure/repositories/tickets.repository.js';

export type SubmitTicketSatisfactionInput = {
  ticketId: string;
  tenantId: string;
  authUser: AuthenticatedUser;
  rating: number;
  comment?: string;
};

export class SubmitTicketSatisfactionUseCase {
  constructor(
    private readonly ticketsRepo: TicketsRepository = ticketsRepository,
    private readonly satisfactionRepo: TicketSatisfactionRepository = defaultTicketSatisfactionRepository,
    private readonly historyRepo: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly eventBus: EventBus = defaultEventBus,
  ) {}

  async execute(
    input: SubmitTicketSatisfactionInput,
  ): Promise<TicketSatisfactionSurvey> {
    await assertFeatureEnabled(FeatureFlagKey.CSAT);

    const ticket = await this.ticketsRepo.findById(input.ticketId);

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    assertTicketForTenant(ticket, input.tenantId);
    assertCanSubmitTicketSatisfaction(input.authUser, ticket);

    const existingSurvey = await this.satisfactionRepo.findByTicketId(
      input.ticketId,
      input.tenantId,
    );
    assertTicketHasNoSatisfactionSurvey(existingSurvey);

    const survey = await this.satisfactionRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      customerId: input.authUser.id,
      rating: input.rating,
      comment: input.comment,
    });

    await this.historyRepo.create({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
      event: TicketHistoryEvent.SATISFACTION_SUBMITTED,
      field: 'rating',
      newValue: String(input.rating),
      metadata: {
        surveyId: survey.id,
        rating: input.rating,
        customerId: input.authUser.id,
        ...(input.comment ? { comment: input.comment } : {}),
      },
    });

    await this.eventBus.publish(
      createCsatSubmittedEvent({
        tenantId: input.tenantId,
        ticket,
        survey,
        customerId: input.authUser.id,
      }),
    );

    return survey;
  }
}

export const submitTicketSatisfactionUseCase =
  new SubmitTicketSatisfactionUseCase();
