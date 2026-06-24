import { describe, expect, it } from 'vitest';

import { EmailNotificationEvent } from '../../domain/email-notification-event.js';
import { renderEmailTemplate } from './render-email-template.js';

describe('renderEmailTemplate', () => {
  const context = {
    recipientName: 'Maria',
    ticketProtocol: 'TK-001',
    ticketTitle: 'Problema no sistema',
  };

  it('should render ticket resolved template', () => {
    const template = renderEmailTemplate(
      EmailNotificationEvent.TICKET_RESOLVED,
      context,
    );

    expect(template.subject).toBe('Chamado resolvido');
    expect(template.html).toContain('Problema no sistema');
    expect(template.text).toContain('TK-001');
  });

  it('should render sla warning template with hours remaining', () => {
    const template = renderEmailTemplate(EmailNotificationEvent.SLA_WARNING, {
      ...context,
      hoursRemaining: 4,
    });

    expect(template.html).toContain('4');
  });
});
