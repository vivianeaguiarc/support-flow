import { describe, expect, it } from 'vitest';

import {
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from './webhook-signature.js';

describe('webhook-signature', () => {
  it('should generate secrets with whsec_ prefix', () => {
    const secret = generateWebhookSecret();
    expect(secret.startsWith('whsec_')).toBe(true);
    expect(secret.length).toBeGreaterThan(20);
  });

  it('should sign payload with sha256 prefix', () => {
    const secret = 'whsec_test_secret';
    const body = JSON.stringify({ event: 'ticket.created' });
    const signature = signWebhookPayload(secret, body);

    expect(signature.startsWith('sha256=')).toBe(true);
    expect(signature.length).toBeGreaterThan(10);
  });

  it('should verify valid signatures', () => {
    const secret = 'whsec_test_secret';
    const body = JSON.stringify({ hello: 'world' });
    const signature = signWebhookPayload(secret, body);

    expect(verifyWebhookSignature(secret, body, signature)).toBe(true);
    expect(verifyWebhookSignature(secret, body, 'sha256=invalid')).toBe(false);
  });
});
