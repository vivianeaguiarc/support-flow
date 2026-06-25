/**
 * Convenience factory that wires the low-level client together with the
 * resource-oriented APIs, so a frontend can create everything in one call.
 */
import { AuthApi } from './apis/auth.api';
import { TicketsApi } from './apis/tickets.api';
import {
  createSupportFlowClient,
  type CreateSupportFlowClientOptions,
  type SupportFlowApiClient,
} from './client';

export interface SupportFlowSdk {
  /** Low-level typed client (escape hatch for any endpoint). */
  client: SupportFlowApiClient;
  auth: AuthApi;
  tickets: TicketsApi;
}

/**
 * Creates a ready-to-use SupportFlow SDK instance.
 *
 * @example
 * const sdk = createSupportFlowSdk({
 *   baseUrl: 'https://api.supportflow.com/api/v1',
 *   accessToken: token,
 * });
 * const { data } = await sdk.tickets.list({ params: { query: { status: 'OPEN' } } });
 */
export function createSupportFlowSdk(
  options: CreateSupportFlowClientOptions = {},
): SupportFlowSdk {
  const client = createSupportFlowClient(options);

  return {
    client,
    auth: new AuthApi(client),
    tickets: new TicketsApi(client),
  };
}
