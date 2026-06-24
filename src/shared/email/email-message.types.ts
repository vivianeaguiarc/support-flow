export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailProviderHealth = {
  provider: string;
  enabled: boolean;
  configured: boolean;
  ready: boolean;
  message: string;
};
