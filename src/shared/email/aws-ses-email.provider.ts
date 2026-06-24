import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';
import type { EmailProvider } from './email-provider.interface.js';

export class AwsSesEmailProvider implements EmailProvider {
  readonly name = 'aws-ses';

  async send(_message: EmailMessage): Promise<void> {
    throw new Error('AWS SES provider is not implemented yet');
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    return {
      provider: this.name,
      enabled: true,
      configured: false,
      ready: false,
      message: 'AWS SES provider is not implemented yet',
    };
  }
}

export const awsSesEmailProvider = new AwsSesEmailProvider();
