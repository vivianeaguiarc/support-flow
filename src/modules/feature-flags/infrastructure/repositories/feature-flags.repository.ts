import type { FeatureFlagAuditAction } from '@prisma/client';

import { prisma } from '../../../../shared/database/prisma.js';
import type {
  FeatureFlag,
  FeatureFlagAudit,
} from '../../domain/feature-flag.entity.js';

function toFeatureFlag(record: {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): FeatureFlag {
  return {
    id: record.id,
    key: record.key,
    description: record.description,
    enabled: record.enabled,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toFeatureFlagAudit(record: {
  id: string;
  featureFlagId: string | null;
  key: string;
  action: FeatureFlagAuditAction;
  enabled: boolean | null;
  previousEnabled: boolean | null;
  changedById: string | null;
  createdAt: Date;
}): FeatureFlagAudit {
  return {
    id: record.id,
    featureFlagId: record.featureFlagId,
    key: record.key,
    action: record.action,
    enabled: record.enabled,
    previousEnabled: record.previousEnabled,
    changedById: record.changedById,
    createdAt: record.createdAt,
  };
}

export type CreateFeatureFlagData = {
  key: string;
  description?: string | null;
  enabled: boolean;
};

export type UpdateFeatureFlagData = {
  description?: string | null;
  enabled?: boolean;
};

export type RecordFeatureFlagAuditData = {
  featureFlagId?: string | null;
  key: string;
  action: FeatureFlagAuditAction;
  enabled?: boolean | null;
  previousEnabled?: boolean | null;
  changedById?: string | null;
};

export class FeatureFlagsRepository {
  async create(data: CreateFeatureFlagData): Promise<FeatureFlag> {
    const record = await prisma.featureFlag.create({
      data: {
        key: data.key,
        description: data.description ?? null,
        enabled: data.enabled,
      },
    });

    return toFeatureFlag(record);
  }

  async findAll(): Promise<FeatureFlag[]> {
    const records = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });

    return records.map(toFeatureFlag);
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    const record = await prisma.featureFlag.findUnique({
      where: { key },
    });

    return record ? toFeatureFlag(record) : null;
  }

  async updateByKey(
    key: string,
    data: UpdateFeatureFlagData,
  ): Promise<FeatureFlag | null> {
    const existing = await this.findByKey(key);
    if (!existing) {
      return null;
    }

    const record = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      },
    });

    return toFeatureFlag(record);
  }

  async deleteByKey(key: string): Promise<FeatureFlag | null> {
    const existing = await this.findByKey(key);
    if (!existing) {
      return null;
    }

    await prisma.featureFlag.delete({ where: { key } });
    return existing;
  }

  async recordAudit(
    data: RecordFeatureFlagAuditData,
  ): Promise<FeatureFlagAudit> {
    const record = await prisma.featureFlagAudit.create({
      data: {
        featureFlagId: data.featureFlagId ?? null,
        key: data.key,
        action: data.action,
        enabled: data.enabled ?? null,
        previousEnabled: data.previousEnabled ?? null,
        changedById: data.changedById ?? null,
      },
    });

    return toFeatureFlagAudit(record);
  }
}

export const featureFlagsRepository = new FeatureFlagsRepository();
