import { prisma } from '../../../../shared/database/prisma.js';
import type { ApiKey } from '../../domain/api-key.entity.js';

function toApiKey(record: {
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
}): ApiKey {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    prefix: record.prefix,
    active: record.active,
    lastUsedAt: record.lastUsedAt,
    expiresAt: record.expiresAt,
    createdById: record.createdById,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export type CreateApiKeyData = {
  tenantId: string;
  name: string;
  keyHash: string;
  prefix: string;
  expiresAt?: Date | null;
  createdById: string;
};

export class ApiKeysRepository {
  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const record = await prisma.apiKey.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        keyHash: data.keyHash,
        prefix: data.prefix,
        expiresAt: data.expiresAt,
        createdById: data.createdById,
      },
    });

    return toApiKey(record);
  }

  async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const record = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    return record ? toApiKey(record) : null;
  }

  async findByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<ApiKey | null> {
    const record = await prisma.apiKey.findFirst({
      where: { id, tenantId },
    });

    return record ? toApiKey(record) : null;
  }

  async listByTenant(tenantId: string): Promise<ApiKey[]> {
    const records = await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toApiKey);
  }

  async revoke(id: string, tenantId: string): Promise<ApiKey> {
    const record = await prisma.apiKey.update({
      where: { id },
      data: { active: false },
    });

    if (record.tenantId !== tenantId) {
      throw new Error('API key tenant mismatch');
    }

    return toApiKey(record);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findByIdAndTenant(id, tenantId);
    if (!existing) {
      return;
    }

    await prisma.apiKey.delete({ where: { id } });
  }

  async touchLastUsedAt(id: string): Promise<void> {
    await prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
}

export const apiKeysRepository = new ApiKeysRepository();
