import { describe, expect, it } from 'vitest';

import { sanitizeLogData } from './sensitive-redaction.js';

describe('sanitizeLogData', () => {
  it('removes sensitive keys from flat objects', () => {
    const result = sanitizeLogData({
      ticketId: 'ticket-1',
      password: 'secret',
      refreshToken: 'rt-123',
      accessToken: 'at-456',
    });

    expect(result).toEqual({ ticketId: 'ticket-1' });
  });

  it('removes sensitive keys from nested objects', () => {
    const result = sanitizeLogData({
      actor: {
        id: 'user-1',
        token: 'jwt',
      },
    });

    expect(result).toEqual({
      actor: {
        id: 'user-1',
      },
    });
  });
});
