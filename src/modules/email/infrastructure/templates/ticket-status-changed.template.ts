import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketStatusChangedTemplate(
  context: EmailTemplateContext,
) {
  return createSimpleTemplate(
    'Status do chamado alterado',
    `Olá ${context.recipientName}, o status do chamado foi atualizado.`,
    context,
    [
      { label: 'Status anterior', value: context.oldStatus ?? '-' },
      { label: 'Novo status', value: context.newStatus ?? '-' },
    ],
  );
}
