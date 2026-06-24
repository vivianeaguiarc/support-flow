import { describe, expect, it, vi } from 'vitest';

import { ForbiddenError } from '../errors/http-errors.js';

const isEnabledMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock(
  '../../modules/feature-flags/application/services/feature-flag.service.js',
  () => ({
    featureFlagService: {
      isEnabled: isEnabledMock,
    },
  }),
);

import { assertFeatureEnabled } from './require-feature-flag.js';

describe('requireFeatureFlag helpers', () => {
  it('does not throw when feature is enabled', async () => {
    isEnabledMock.mockResolvedValueOnce(true);

    await expect(assertFeatureEnabled('webhooks')).resolves.toBeUndefined();
  });

  it('throws forbidden when feature is disabled', async () => {
    isEnabledMock.mockResolvedValueOnce(false);

    await expect(assertFeatureEnabled('reports.csv')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
