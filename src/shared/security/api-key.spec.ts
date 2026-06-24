import { describe, expect, it } from 'vitest';

import {
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
} from './api-key.js';

describe('api-key', () => {
  it('should generate keys with supportflow_sk_live_ prefix', () => {
    const result = generateApiKey();

    expect(result.key.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(result.prefix.startsWith(API_KEY_PREFIX)).toBe(true);
    expect(result.keyHash).toBe(hashApiKey(result.key));
    expect(isValidApiKeyFormat(result.key)).toBe(true);
  });

  it('should reject invalid key formats', () => {
    expect(isValidApiKeyFormat('invalid_key')).toBe(false);
    expect(isValidApiKeyFormat(`${API_KEY_PREFIX}short`)).toBe(false);
  });

  it('should hash keys deterministically', () => {
    const key = `${API_KEY_PREFIX}abcdefghijklmnopqrstuvwxyz123456`;
    expect(hashApiKey(key)).toHaveLength(64);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });
});
