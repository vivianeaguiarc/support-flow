import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketAssignedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'Chamado atribuído a você',
    `Olá ${context.recipientName}, um chamado foi atribuído a você.`,
    context,
  );
}
