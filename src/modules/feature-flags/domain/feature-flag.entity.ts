export type FeatureFlag = {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FeatureFlagAudit = {
  id: string;
  featureFlagId: string | null;
  key: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  enabled: boolean | null;
  previousEnabled: boolean | null;
  changedById: string | null;
  createdAt: Date;
};
