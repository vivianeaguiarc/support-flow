import type { EmailNotificationEvent } from '../../domain/email-notification-event.js';
import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { renderSlaBreachedTemplate } from './sla-breached.template.js';
import { renderSlaWarningTemplate } from './sla-warning.template.js';
import { renderTicketAssignedTemplate } from './ticket-assigned.template.js';
import { renderTicketClosedTemplate } from './ticket-closed.template.js';
import { renderTicketCreatedTemplate } from './ticket-created.template.js';
import { renderTicketReassignedTemplate } from './ticket-reassigned.template.js';
import { renderTicketResolvedTemplate } from './ticket-resolved.template.js';
import { renderTicketStatusChangedTemplate } from './ticket-status-changed.template.js';

export type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

type TemplateRenderer = (
  context: EmailTemplateContext,
) => RenderedEmailTemplate;

const TEMPLATE_RENDERERS: Record<EmailNotificationEvent, TemplateRenderer> = {
  TICKET_CREATED: renderTicketCreatedTemplate,
  TICKET_ASSIGNED: renderTicketAssignedTemplate,
  TICKET_REASSIGNED: renderTicketReassignedTemplate,
  TICKET_STATUS_CHANGED: renderTicketStatusChangedTemplate,
  TICKET_RESOLVED: renderTicketResolvedTemplate,
  TICKET_CLOSED: renderTicketClosedTemplate,
  SLA_WARNING: renderSlaWarningTemplate,
  SLA_BREACHED: renderSlaBreachedTemplate,
};

export function renderEmailTemplate(
  event: EmailNotificationEvent,
  context: EmailTemplateContext,
): RenderedEmailTemplate {
  return TEMPLATE_RENDERERS[event](context);
}
