import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketReassignedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'Chamado reatribuído',
    `Olá ${context.recipientName}, um chamado foi reatribuído para você.`,
    context,
  );
}
