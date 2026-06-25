/**
 * Typed HTTP client for the SupportFlow API.
 *
 * Thin, dependency-light wrapper around `openapi-fetch`, fully typed by the
 * generated `paths` from `./generated/openapi.types`. This file is stable and
 * does NOT need manual edits when endpoints change — only the generated types
 * are regenerated (see `pnpm sdk:generate` from the backend root).
 */
import createClient, { type Client, type ClientOptions } from 'openapi-fetch';

import type { paths } from './generated/openapi.types';

/** Fully-typed SupportFlow API client (all paths, methods, params, bodies). */
export type SupportFlowApiClient = Client<paths>;

export interface CreateSupportFlowClientOptions extends Omit<
  ClientOptions,
  'headers'
> {
  /** JWT access token sent as `Authorization: Bearer <token>`. */
  accessToken?: string;
  /** API key sent as `x-api-key` (external integrations). */
  apiKey?: string;
  /** Extra default headers merged into every request. */
  headers?: Record<string, string>;
}

/** Default base URL for local development (`/api/v1`). */
export const DEFAULT_BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Creates a low-level, typed SupportFlow API client.
 *
 * @example
 * const client = createSupportFlowClient({
 *   baseUrl: 'https://api.supportflow.com/api/v1',
 *   accessToken: token,
 * });
 * const { data, error } = await client.GET('/auth/me');
 */
export function createSupportFlowClient(
  options: CreateSupportFlowClientOptions = {},
): SupportFlowApiClient {
  const { accessToken, apiKey, baseUrl, headers, ...rest } = options;

  return createClient<paths>({
    baseUrl: baseUrl ?? DEFAULT_BASE_URL,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(apiKey ? { 'x-api-key': apiKey } : {}),
      ...headers,
    },
    ...rest,
  });
}
