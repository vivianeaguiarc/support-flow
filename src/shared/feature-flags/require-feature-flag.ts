import type { NextFunction, Request, Response } from 'express';

import { featureFlagService } from '../../modules/feature-flags/application/services/feature-flag.service.js';
import { resolveFeatureFlagDefault } from '../../modules/feature-flags/domain/feature-flag-keys.js';
import { ForbiddenError } from '../errors/http-errors.js';

export async function assertFeatureEnabled(
  key: string,
  defaultValue?: boolean,
): Promise<void> {
  const enabled = await featureFlagService.isEnabled(
    key,
    defaultValue ?? resolveFeatureFlagDefault(key),
  );

  if (!enabled) {
    throw new ForbiddenError(`Feature "${key}" is disabled`);
  }
}

export function requireFeatureFlag(key: string, defaultValue?: boolean) {
  return async (
    _req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await assertFeatureEnabled(key, defaultValue);
      next();
    } catch (error) {
      next(error);
    }
  };
}
