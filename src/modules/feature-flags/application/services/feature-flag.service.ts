import {
  ConflictError,
  NotFoundError,
} from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { FeatureFlag } from '../../domain/feature-flag.entity.js';
import { resolveFeatureFlagDefault } from '../../domain/feature-flag-keys.js';
import {
  FeatureFlagCache,
  featureFlagCache as defaultFeatureFlagCache,
} from '../../infrastructure/feature-flag-cache.js';
import {
  FeatureFlagsRepository,
  featureFlagsRepository as defaultFeatureFlagsRepository,
} from '../../infrastructure/repositories/feature-flags.repository.js';
import type {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from '../../presentation/dtos/feature-flag.dto.js';

export class FeatureFlagService {
  constructor(
    private readonly repository: FeatureFlagsRepository = defaultFeatureFlagsRepository,
    private readonly cache: FeatureFlagCache = defaultFeatureFlagCache,
  ) {}

  async isEnabled(key: string, defaultValue?: boolean): Promise<boolean> {
    const cached = await this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const flag = await this.repository.findByKey(key);
    const enabled =
      flag?.enabled ?? defaultValue ?? resolveFeatureFlagDefault(key);

    await this.cache.set(key, enabled);
    return enabled;
  }

  async list(): Promise<FeatureFlag[]> {
    return this.repository.findAll();
  }

  async create(
    authUser: AuthenticatedUser,
    input: CreateFeatureFlagDto,
  ): Promise<FeatureFlag> {
    const existing = await this.repository.findByKey(input.key);
    if (existing) {
      throw new ConflictError(`Feature flag "${input.key}" already exists`);
    }

    const flag = await this.repository.create({
      key: input.key,
      description: input.description,
      enabled: input.enabled,
    });

    await this.cache.set(flag.key, flag.enabled);

    await this.repository.recordAudit({
      featureFlagId: flag.id,
      key: flag.key,
      action: 'CREATED',
      enabled: flag.enabled,
      changedById: authUser.id,
    });

    logBusinessEvent(BusinessEvent.FEATURE_FLAG_CREATED, {
      actorId: authUser.id,
      key: flag.key,
      enabled: flag.enabled,
    });

    return flag;
  }

  async updateByKey(
    authUser: AuthenticatedUser,
    key: string,
    input: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag> {
    const existing = await this.repository.findByKey(key);
    if (!existing) {
      throw new NotFoundError('Feature flag not found');
    }

    const updated = await this.repository.updateByKey(key, input);
    if (!updated) {
      throw new NotFoundError('Feature flag not found');
    }

    await this.cache.invalidate(key);
    await this.cache.set(updated.key, updated.enabled);

    await this.repository.recordAudit({
      featureFlagId: updated.id,
      key: updated.key,
      action: 'UPDATED',
      enabled: updated.enabled,
      previousEnabled: existing.enabled,
      changedById: authUser.id,
    });

    logBusinessEvent(BusinessEvent.FEATURE_FLAG_UPDATED, {
      actorId: authUser.id,
      key: updated.key,
      enabled: updated.enabled,
      previousEnabled: existing.enabled,
    });

    return updated;
  }

  async deleteByKey(authUser: AuthenticatedUser, key: string): Promise<void> {
    const existing = await this.repository.findByKey(key);
    if (!existing) {
      throw new NotFoundError('Feature flag not found');
    }

    await this.repository.deleteByKey(key);
    await this.cache.invalidate(key);

    await this.repository.recordAudit({
      featureFlagId: null,
      key: existing.key,
      action: 'DELETED',
      enabled: null,
      previousEnabled: existing.enabled,
      changedById: authUser.id,
    });

    logBusinessEvent(BusinessEvent.FEATURE_FLAG_DELETED, {
      actorId: authUser.id,
      key: existing.key,
      previousEnabled: existing.enabled,
    });
  }
}

export const featureFlagService = new FeatureFlagService();
