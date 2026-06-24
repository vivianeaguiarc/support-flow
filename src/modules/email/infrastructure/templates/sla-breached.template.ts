import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { createSimpleTemplate } from './base-template.js';

export function renderSlaBreachedTemplate(context: EmailTemplateContext) {
  return createSimpleTemplate(
    'SLA violado',
    `Olá ${context.recipientName}, o SLA do chamado foi violado.`,
    context,
    [
      {
        label: 'Horas em atraso',
        value: String(context.hoursOverdue ?? '-'),
      },
    ],
  );
}
