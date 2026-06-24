import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';
import type { EmailProvider } from './email-provider.interface.js';

export class NoopEmailProvider implements EmailProvider {
  readonly name = 'noop';

  async send(_message: EmailMessage): Promise<void> {
    // Intentionally no-op for local/test environments.
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    return {
      provider: this.name,
      enabled: false,
      configured: true,
      ready: true,
      message: 'Email delivery is disabled',
    };
  }
}

export const noopEmailProvider = new NoopEmailProvider();
