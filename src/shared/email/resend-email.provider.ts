import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';
import type { EmailProvider } from './email-provider.interface.js';

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  async send(_message: EmailMessage): Promise<void> {
    throw new Error('Resend provider is not implemented yet');
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    return {
      provider: this.name,
      enabled: true,
      configured: false,
      ready: false,
      message: 'Resend provider is not implemented yet',
    };
  }
}

export const resendEmailProvider = new ResendEmailProvider();
