import { createHmac, randomBytes } from 'node:crypto';

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString('hex')}`;
}

export function signWebhookPayload(secret: string, body: string): string {
  const digest = createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  return `sha256=${digest}`;
}

export function verifyWebhookSignature(
  secret: string,
  body: string,
  signature: string,
): boolean {
  const expected = signWebhookPayload(secret, body);
  return expected === signature;
}
