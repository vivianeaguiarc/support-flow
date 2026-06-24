import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderTicketResolvedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'Chamado resolvido',
    `Olá ${context.recipientName}, o chamado foi marcado como resolvido.`,
    context,
  );
}
