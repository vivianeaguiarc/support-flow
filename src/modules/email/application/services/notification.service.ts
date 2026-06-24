import { env } from '../../../../config/env.js';
import {
  type EmailProvider,
  emailProvider,
  type EmailProviderHealth,
} from '../../../../shared/email/index.js';
import { logger } from '../../../../shared/logger/logger.js';
import type { Ticket } from '../../../tickets/domain/ticket.entity.js';
import {
  UsersRepository,
  usersRepository as defaultUsersRepository,
} from '../../../users/repositories/users.repository.js';
import {
  EmailNotificationEvent,
  type EmailNotificationEvent as EmailNotificationEventType,
} from '../../domain/email-notification-event.js';
import type { EmailTemplateContext } from '../../domain/email-template-context.js';
import { renderEmailTemplate } from '../../infrastructure/templates/render-email-template.js';

export type SendTicketEmailInput = {
  event: EmailNotificationEventType;
  ticket: Ticket;
  recipientId: string;
  context?: Partial<EmailTemplateContext>;
};

export class NotificationService {
  constructor(
    private readonly provider: EmailProvider = emailProvider,
    private readonly usersRepository: UsersRepository = defaultUsersRepository,
  ) {}

  async sendTicketNotification(input: SendTicketEmailInput): Promise<void> {
    if (!env.EMAIL_ENABLED) {
      return;
    }

    const recipient = await this.usersRepository.findById(
      input.recipientId,
      input.ticket.tenantId,
    );

    if (!recipient?.email) {
      logger.warn(
        {
          event: input.event,
          ticketId: input.ticket.id,
          recipientId: input.recipientId,
        },
        'email.notification.skipped_missing_recipient',
      );
      return;
    }

    const templateContext: EmailTemplateContext = {
      recipientName: recipient.name,
      ticketProtocol: input.ticket.protocol,
      ticketTitle: input.ticket.title,
      ticketStatus: input.ticket.status,
      ...input.context,
    };

    const template = renderEmailTemplate(input.event, templateContext);

    try {
      await this.provider.send({
        to: recipient.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info(
        {
          event: input.event,
          ticketId: input.ticket.id,
          recipientId: input.recipientId,
          provider: this.provider.name,
        },
        'email.notification.sent',
      );
    } catch (error) {
      logger.error(
        {
          err: error,
          event: input.event,
          ticketId: input.ticket.id,
          recipientId: input.recipientId,
          provider: this.provider.name,
        },
        'email.notification.failed',
      );
    }
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    return this.provider.checkHealth();
  }
}

export const notificationService = new NotificationService();

export { EmailNotificationEvent };
