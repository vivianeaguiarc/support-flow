/**
 * High-level, resource-oriented API for authentication.
 */
import type { MaybeOptionalInit } from 'openapi-fetch';

import type { SupportFlowApiClient } from '../client';
import type { paths } from '../generated/openapi.types';

type Init<P extends keyof paths, M extends keyof paths[P]> = MaybeOptionalInit<
  paths[P],
  M
>;

export class AuthApi {
  constructor(private readonly client: SupportFlowApiClient) {}

  /** Authenticate with email/password and receive access/refresh tokens. */
  login(init: Init<'/auth/login', 'post'>) {
    return this.client.POST('/auth/login', init);
  }

  /** Return the authenticated user based on the bearer token. */
  me(init?: Init<'/auth/me', 'get'>) {
    return this.client.GET('/auth/me', init);
  }
}
