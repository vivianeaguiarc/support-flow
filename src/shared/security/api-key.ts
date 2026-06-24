import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const API_KEY_PREFIX = 'supportflow_sk_live_';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): {
  key: string;
  prefix: string;
  keyHash: string;
} {
  const secret = randomBytes(24).toString('base64url');
  const key = `${API_KEY_PREFIX}${secret}`;
  const prefix = key.slice(0, API_KEY_PREFIX.length + 8);

  return {
    key,
    prefix,
    keyHash: hashApiKey(key),
  };
}

export function isValidApiKeyFormat(key: string): boolean {
  return (
    key.startsWith(API_KEY_PREFIX) && key.length > API_KEY_PREFIX.length + 16
  );
}

export function secureCompareApiKeyHashes(
  left: string,
  right: string,
): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
