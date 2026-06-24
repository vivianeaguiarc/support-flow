import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';
import type { EmailProvider } from './email-provider.interface.js';

export class SendGridEmailProvider implements EmailProvider {
  readonly name = 'sendgrid';

  async send(_message: EmailMessage): Promise<void> {
    throw new Error('SendGrid provider is not implemented yet');
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    return {
      provider: this.name,
      enabled: true,
      configured: false,
      ready: false,
      message: 'SendGrid provider is not implemented yet',
    };
  }
}

export const sendgridEmailProvider = new SendGridEmailProvider();
