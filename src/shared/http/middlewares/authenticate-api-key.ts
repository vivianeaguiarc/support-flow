import type { NextFunction, Request, Response } from 'express';

import { apiKeysRepository } from '../../../modules/api-keys/infrastructure/repositories/api-keys.repository.js';
import { UnauthorizedError } from '../../errors/http-errors.js';
import { applyTenantScopeToRequest } from '../../http/middlewares/tenant-scope.middleware.js';
import {
  BusinessEvent,
  logBusinessEvent,
} from '../../logger/business-logger.js';
import { hashApiKey, isValidApiKeyFormat } from '../../security/api-key.js';
import { UserRole } from '../../types/user-role.js';
import { optionalAuthenticate } from './optional-authenticate.js';

function readApiKeyHeader(req: Request): string | null {
  const header = req.headers['x-api-key'];

  if (typeof header !== 'string') {
    return null;
  }

  const value = header.trim();
  return value.length > 0 ? value : null;
}

function isApiKeyExpired(expiresAt: Date | null): boolean {
  return expiresAt !== null && expiresAt.getTime() <= Date.now();
}

export async function authenticateApiKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const apiKeyValue = readApiKeyHeader(req);

  if (!apiKeyValue) {
    logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
      reason: 'api_key_not_provided',
    });
    next(new UnauthorizedError('API key not provided'));
    return;
  }

  if (!isValidApiKeyFormat(apiKeyValue)) {
    logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
      reason: 'invalid_api_key_format',
    });
    next(new UnauthorizedError('Invalid API key'));
    return;
  }

  try {
    const apiKey = await apiKeysRepository.findByKeyHash(
      hashApiKey(apiKeyValue),
    );

    if (!apiKey || !apiKey.active || isApiKeyExpired(apiKey.expiresAt)) {
      logBusinessEvent(BusinessEvent.AUTH_UNAUTHORIZED, {
        reason: 'invalid_or_inactive_api_key',
      });
      next(new UnauthorizedError('Invalid API key'));
      return;
    }

    req.user = {
      id: apiKey.createdById,
      email: `api-key+${apiKey.prefix}@integration.supportflow`,
      role: UserRole.CUSTOMER,
      tenantId: apiKey.tenantId,
    };
    req.apiKeyId = apiKey.id;
    req.authMethod = 'api_key';

    applyTenantScopeToRequest(req);

    void apiKeysRepository.touchLastUsedAt(apiKey.id).catch(() => undefined);

    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuthenticateWithApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKeyValue = readApiKeyHeader(req);

  if (apiKeyValue) {
    void authenticateApiKey(req, res, next);
    return;
  }

  optionalAuthenticate(req, res, next);
}
