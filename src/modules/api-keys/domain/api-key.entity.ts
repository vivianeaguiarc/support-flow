export type ApiKey = {
  id: string;
  tenantId: string;
  name: string;
  prefix: string;
  active: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKeyWithSecret = ApiKey & {
  key: string;
};
