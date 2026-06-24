import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketCreatedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'Novo chamado criado',
    `Olá ${context.recipientName}, um novo chamado foi criado e atribuído a você.`,
    context,
  );
}
