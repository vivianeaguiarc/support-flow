import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import {
  type AutomationEngine,
  automationEngine,
} from '../../../automation/application/services/automation-engine.js';
import { AutomationTrigger } from '../../../automation/domain/automation-trigger.js';
import {
  type NotificationEventService,
  notificationEventService,
} from '../../../notifications/application/services/notification-event.service.js';
import { buildTicketWebhookData } from '../../../webhooks/application/helpers/webhook-payload.helper.js';
import {
  type WebhookDispatcher,
  webhookDispatcher,
} from '../../../webhooks/application/services/webhook-dispatcher.js';
import { WebhookEvent } from '../../../webhooks/domain/webhook-event.js';
import {
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
import type { UpdateTicketStatusInput } from '../inputs/ticket-use-case.inputs.js';
import {
  FindTicketByIdUseCase,
  findTicketByIdUseCase,
} from './find-ticket-by-id.use-case.js';

export class UpdateTicketStatusUseCase {
  constructor(
    private readonly ticketsRepository: TicketsRepository = defaultTicketsRepository,
    private readonly ticketHistoryRepository: TicketHistoryRepository = defaultTicketHistoryRepository,
    private readonly findTicket: FindTicketByIdUseCase = findTicketByIdUseCase,
    private readonly notificationService: NotificationEventService = notificationEventService,
    private readonly automation: AutomationEngine = automationEngine,
    private readonly webhooks: WebhookDispatcher = webhookDispatcher,
  ) {}

  async execute(input: UpdateTicketStatusInput): Promise<Ticket> {
    const ticket = await this.findTicket.execute({
      tenantId: input.tenantId,
      ticketId: input.ticketId,
    });

    assertValidTicketStatusTransition(ticket.status, input.status);
    assertAssigneeRequiredForInProgress(ticket, input.status);

    const updatedTicket = await this.ticketsRepository.updateStatus(
      ticket.id,
      input.status,
    );

    await this.ticketHistoryRepository.create({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      event: TicketHistoryEvent.STATUS_CHANGED,
      field: 'status',
      oldValue: ticket.status,
      newValue: input.status,
      changedById: input.changedById,
    });

    await this.notificationService.notifyTicketStatusChanged(
      updatedTicket,
      ticket.status,
      input.status,
    );

    logBusinessEvent(BusinessEvent.TICKET_STATUS_CHANGED, {
      tenantId: input.tenantId,
      ticketId: ticket.id,
      fromStatus: ticket.status,
      toStatus: input.status,
      actorId: input.changedById,
    });

    await this.automation.processEvent({
      tenantId: input.tenantId,
      ticketId: ticket.id,
      trigger: AutomationTrigger.STATUS_CHANGED,
      ticket: updatedTicket,
      previousTicket: { status: ticket.status },
      actorId: input.changedById,
    });

    const ticketData = {
      ...buildTicketWebhookData(updatedTicket),
      fromStatus: ticket.status,
      toStatus: input.status,
    };

    await this.webhooks.dispatch(
      input.tenantId,
      WebhookEvent.TICKET_UPDATED,
      ticketData,
    );

    if (input.status === TicketStatus.RESOLVED) {
      await this.webhooks.dispatch(
        input.tenantId,
        WebhookEvent.TICKET_RESOLVED,
        ticketData,
      );
    }

    if (input.status === TicketStatus.CLOSED) {
      await this.webhooks.dispatch(
        input.tenantId,
        WebhookEvent.TICKET_CLOSED,
        ticketData,
      );
    }

    return updatedTicket;
  }
}

export const updateTicketStatusUseCase = new UpdateTicketStatusUseCase();
