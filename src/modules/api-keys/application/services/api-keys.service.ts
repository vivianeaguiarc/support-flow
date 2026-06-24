import { NotFoundError } from '../../../../shared/errors/http-errors.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../../../shared/logger/business-logger.js';
import { generateApiKey } from '../../../../shared/security/api-key.js';
import type { AuthenticatedUser } from '../../../../shared/types/authenticated-user.js';
import type { ApiKey, ApiKeyWithSecret } from '../../domain/api-key.entity.js';
import {
  ApiKeysRepository,
  apiKeysRepository as defaultApiKeysRepository,
} from '../../infrastructure/repositories/api-keys.repository.js';
import type { CreateApiKeyDto } from '../../presentation/dtos/create-api-key.dto.js';

export class ApiKeysService {
  constructor(
    private readonly repository: ApiKeysRepository = defaultApiKeysRepository,
  ) {}

  async create(
    authUser: AuthenticatedUser,
    input: CreateApiKeyDto,
  ): Promise<ApiKeyWithSecret> {
    const { key, prefix, keyHash } = generateApiKey();

    const apiKey = await this.repository.create({
      tenantId: authUser.tenantId,
      name: input.name,
      keyHash,
      prefix,
      expiresAt: input.expiresAt,
      createdById: authUser.id,
    });

    logBusinessEvent(BusinessEvent.API_KEY_CREATED, {
      tenantId: authUser.tenantId,
      apiKeyId: apiKey.id,
      actorId: authUser.id,
      prefix: apiKey.prefix,
    });

    return { ...apiKey, key };
  }

  async list(authUser: AuthenticatedUser): Promise<ApiKey[]> {
    return this.repository.listByTenant(authUser.tenantId);
  }

  async revoke(authUser: AuthenticatedUser, id: string): Promise<ApiKey> {
    const existing = await this.repository.findByIdAndTenant(
      id,
      authUser.tenantId,
    );

    if (!existing) {
      throw new NotFoundError('API key not found');
    }

    const apiKey = await this.repository.revoke(id, authUser.tenantId);

    logBusinessEvent(BusinessEvent.API_KEY_REVOKED, {
      tenantId: authUser.tenantId,
      apiKeyId: apiKey.id,
      actorId: authUser.id,
      prefix: apiKey.prefix,
    });

    return apiKey;
  }

  async delete(authUser: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.repository.findByIdAndTenant(
      id,
      authUser.tenantId,
    );

    if (!existing) {
      throw new NotFoundError('API key not found');
    }

    await this.repository.delete(id, authUser.tenantId);

    logBusinessEvent(BusinessEvent.API_KEY_DELETED, {
      tenantId: authUser.tenantId,
      apiKeyId: id,
      actorId: authUser.id,
      prefix: existing.prefix,
    });
  }
}

export const apiKeysService = new ApiKeysService();
