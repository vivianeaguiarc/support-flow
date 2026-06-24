import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';

import { env } from '../../config/env.js';
import { logger } from '../logger/logger.js';
import type {
  EmailMessage,
  EmailProviderHealth,
} from './email-message.types.js';
import type { EmailProvider } from './email-provider.interface.js';

export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth:
          env.SMTP_USER && env.SMTP_PASSWORD
            ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASSWORD,
              }
            : undefined,
      });
    }

    return this.transporter;
  }

  async send(message: EmailMessage): Promise<void> {
    const transporter = this.getTransporter();

    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }

  async checkHealth(): Promise<EmailProviderHealth> {
    if (!env.SMTP_HOST || !env.SMTP_FROM) {
      return {
        provider: this.name,
        enabled: true,
        configured: false,
        ready: false,
        message: 'SMTP_HOST and SMTP_FROM are required',
      };
    }

    try {
      await this.getTransporter().verify();
      return {
        provider: this.name,
        enabled: true,
        configured: true,
        ready: true,
        message: 'SMTP connection verified',
      };
    } catch (error) {
      logger.warn({ err: error }, 'SMTP health check failed');

      return {
        provider: this.name,
        enabled: true,
        configured: true,
        ready: false,
        message: 'SMTP connection failed',
      };
    }
  }
}

export const smtpEmailProvider = new SmtpEmailProvider();
