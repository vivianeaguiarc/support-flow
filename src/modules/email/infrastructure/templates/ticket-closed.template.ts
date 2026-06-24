import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketClosedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'Chamado fechado',
    `Olá ${context.recipientName}, o chamado foi encerrado.`,
    context,
  );
}
