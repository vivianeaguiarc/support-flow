import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRole } from '../../../../shared/types/user-role.js';
import type { FeatureFlag } from '../../domain/feature-flag.entity.js';
import { FeatureFlagService } from './feature-flag.service.js';

vi.mock('../../../../shared/logger/business-logger.js', () => ({
  logBusinessEvent: vi.fn(),
  BusinessEvent: {
    FEATURE_FLAG_CREATED: 'feature_flag.created',
    FEATURE_FLAG_UPDATED: 'feature_flag.updated',
    FEATURE_FLAG_DELETED: 'feature_flag.deleted',
  },
}));

const repositoryMock = {
  findByKey: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  updateByKey: vi.fn(),
  deleteByKey: vi.fn(),
  recordAudit: vi.fn(),
};

const cacheMock = {
  get: vi.fn(),
  set: vi.fn(),
  invalidate: vi.fn(),
};

describe('FeatureFlagService', () => {
  const service = new FeatureFlagService(
    repositoryMock as never,
    cacheMock as never,
  );

  const sampleFlag: FeatureFlag = {
    id: 'flag-1',
    key: 'webhooks',
    description: 'Webhooks',
    enabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cacheMock.get.mockResolvedValue(undefined);
    cacheMock.set.mockResolvedValue(undefined);
    cacheMock.invalidate.mockResolvedValue(undefined);
    repositoryMock.recordAudit.mockResolvedValue({
      id: 'audit-1',
      featureFlagId: 'flag-1',
      key: 'webhooks',
      action: 'CREATED',
      enabled: false,
      previousEnabled: null,
      changedById: 'admin-1',
      createdAt: new Date(),
    });
  });

  it('returns cached value when available', async () => {
    cacheMock.get.mockResolvedValue(true);

    const enabled = await service.isEnabled('webhooks');

    expect(enabled).toBe(true);
    expect(repositoryMock.findByKey).not.toHaveBeenCalled();
  });

  it('uses repository value when cache misses', async () => {
    repositoryMock.findByKey.mockResolvedValue(sampleFlag);

    const enabled = await service.isEnabled('webhooks');

    expect(enabled).toBe(false);
    expect(cacheMock.set).toHaveBeenCalledWith('webhooks', false);
  });

  it('falls back to explicit default when flag does not exist', async () => {
    repositoryMock.findByKey.mockResolvedValue(null);

    const enabled = await service.isEnabled('unknown.feature');

    expect(enabled).toBe(false);
  });

  it('falls back to known defaults for built-in keys', async () => {
    repositoryMock.findByKey.mockResolvedValue(null);

    await expect(service.isEnabled('webhooks')).resolves.toBe(true);
    await expect(service.isEnabled('automation')).resolves.toBe(true);
  });

  it('records audit and invalidates cache on update', async () => {
    repositoryMock.findByKey.mockResolvedValue(sampleFlag);
    repositoryMock.updateByKey.mockResolvedValue({
      ...sampleFlag,
      enabled: true,
    });

    const authUser = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      tenantId: 'tenant-1',
    };

    const updated = await service.updateByKey(authUser, 'webhooks', {
      enabled: true,
    });

    expect(updated.enabled).toBe(true);
    expect(cacheMock.invalidate).toHaveBeenCalledWith('webhooks');
    expect(repositoryMock.recordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATED',
        key: 'webhooks',
        previousEnabled: false,
        enabled: true,
      }),
    );
  });
});
