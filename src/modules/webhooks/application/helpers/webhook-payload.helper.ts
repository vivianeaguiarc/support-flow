import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import type { TicketSatisfactionSurvey } from '../../../tickets/domain/ticket-satisfaction-survey.entity.js';

export function buildTicketWebhookData(
  ticket: Ticket,
): Record<string, unknown> {
  return {
    ticketId: ticket.id,
    protocol: ticket.protocol,
    status: ticket.status,
    priority: ticket.priority,
    customerId: ticket.customerId,
    assignedToId: ticket.assignedToId,
    categoryId: ticket.categoryId,
    title: ticket.title,
    slaDueAt: ticket.slaDueAt?.toISOString() ?? null,
    tenantId: ticket.tenantId,
  };
}

export function buildCsatWebhookData(
  survey: TicketSatisfactionSurvey,
  ticket: Ticket,
): Record<string, unknown> {
  return {
    surveyId: survey.id,
    ticketId: survey.ticketId,
    protocol: ticket.protocol,
    customerId: survey.customerId,
    rating: survey.rating,
    comment: survey.comment,
    submittedAt: survey.submittedAt.toISOString(),
  };
}
