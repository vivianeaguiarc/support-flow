/**
 * SupportFlow TypeScript SDK — public entry point.
 *
 * - `openapi.types.ts` is auto-generated from `docs/openapi.json` and MUST NOT
 *   be edited by hand (run `pnpm sdk:generate` to refresh it).
 * - `client.ts` is a stable typed wrapper around `openapi-fetch`.
 */
export {
  createSupportFlowClient,
  type CreateSupportFlowClientOptions,
  DEFAULT_BASE_URL,
  type SupportFlowApiClient,
} from './client.js';
export type { components, operations, paths } from './openapi.types.js';
