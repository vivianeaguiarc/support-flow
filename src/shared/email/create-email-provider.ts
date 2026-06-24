import { env } from '../../config/env.js';
import { awsSesEmailProvider } from './aws-ses-email.provider.js';
import type { EmailProvider } from './email-provider.interface.js';
import { noopEmailProvider } from './noop-email.provider.js';
import { resendEmailProvider } from './resend-email.provider.js';
import { sendgridEmailProvider } from './sendgrid-email.provider.js';
import { smtpEmailProvider } from './smtp-email.provider.js';

const PROVIDERS = {
  smtp: smtpEmailProvider,
  sendgrid: sendgridEmailProvider,
  resend: resendEmailProvider,
  'aws-ses': awsSesEmailProvider,
  noop: noopEmailProvider,
} as const satisfies Record<string, EmailProvider>;

export type EmailProviderName = keyof typeof PROVIDERS;

export function createEmailProvider(): EmailProvider {
  if (!env.EMAIL_ENABLED) {
    return noopEmailProvider;
  }

  return PROVIDERS[env.EMAIL_PROVIDER];
}

export const emailProvider = createEmailProvider();
