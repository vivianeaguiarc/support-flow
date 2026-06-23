import { describe, expect, it } from 'vitest';

import { hashRefreshToken } from './token-hash.js';

describe('hashRefreshToken', () => {
  it('should return a deterministic sha256 hex digest', () => {
    const token = 'sample-refresh-token';

    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce different hashes for different tokens', () => {
    expect(hashRefreshToken('token-a')).not.toBe(hashRefreshToken('token-b'));
  });
});
