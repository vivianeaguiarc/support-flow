export const FeatureFlagKey = {
  WEBHOOKS: 'webhooks',
  AUTOMATION: 'automation',
  REPORTS_CSV: 'reports.csv',
  CSAT: 'csat',
} as const;

export type FeatureFlagKeyName =
  (typeof FeatureFlagKey)[keyof typeof FeatureFlagKey];

/**
 * Defaults when a flag record does not exist yet.
 * Unknown keys fall back to `false` (disabled).
 */
export const FEATURE_FLAG_DEFAULTS: Record<string, boolean> = {
  [FeatureFlagKey.WEBHOOKS]: true,
  [FeatureFlagKey.AUTOMATION]: true,
  [FeatureFlagKey.REPORTS_CSV]: true,
  [FeatureFlagKey.CSAT]: true,
};

export function resolveFeatureFlagDefault(key: string): boolean {
  return FEATURE_FLAG_DEFAULTS[key] ?? false;
}
