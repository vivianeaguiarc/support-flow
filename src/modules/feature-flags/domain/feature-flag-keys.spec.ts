import { describe, expect, it } from 'vitest';

import {
  FEATURE_FLAG_DEFAULTS,
  FeatureFlagKey,
  resolveFeatureFlagDefault,
} from './feature-flag-keys.js';

describe('feature-flag-keys', () => {
  it('defines defaults for built-in feature keys', () => {
    expect(FEATURE_FLAG_DEFAULTS[FeatureFlagKey.WEBHOOKS]).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS[FeatureFlagKey.AUTOMATION]).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS[FeatureFlagKey.REPORTS_CSV]).toBe(true);
    expect(FEATURE_FLAG_DEFAULTS[FeatureFlagKey.CSAT]).toBe(true);
  });

  it('resolves unknown keys to disabled', () => {
    expect(resolveFeatureFlagDefault('unknown.feature')).toBe(false);
  });
});
