import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderSlaWarningTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'SLA próximo do vencimento',
    `Olá ${context.recipientName}, o SLA do chamado está próximo do vencimento.`,
    context,
    [
      {
        label: 'Horas restantes',
        value: String(context.hoursRemaining ?? '-'),
      },
    ],
  );
}
