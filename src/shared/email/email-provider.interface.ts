import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
  checkHealth(): Promise<EmailProviderHealth>;
}
