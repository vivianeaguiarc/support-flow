/**
 * @supportflow/sdk — public entry point.
 *
 * Layers exposed:
 *   - API client  : low-level typed `openapi-fetch` wrapper
 *   - resource API: ergonomic `TicketsApi` / `AuthApi` classes
 *   - SDK factory : `createSupportFlowSdk` (client + resource APIs)
 *   - types       : convenience aliases (Ticket, AuthUser, ...)
 *   - schemas     : raw generated `components` / `operations` / `paths`
 *
 * The generated `openapi.types.ts` MUST NOT be edited by hand — refresh it with
 * `pnpm sdk:generate` from the backend root.
 */

// --- API client (low-level) ---
export {
  createSupportFlowClient,
  type CreateSupportFlowClientOptions,
  DEFAULT_BASE_URL,
  type SupportFlowApiClient,
} from './client';

// --- Resource APIs (high-level) ---
export { AuthApi } from './apis/auth.api';
export { TicketsApi } from './apis/tickets.api';

// --- SDK factory ---
export { createSupportFlowSdk, type SupportFlowSdk } from './sdk';

// --- Convenience types ---
export type {
  ApiError,
  AuthUser,
  PaginationMeta,
  Schemas,
  Ticket,
  TicketPriority,
  TicketStatus,
} from './types';

// --- Raw generated schemas (escape hatch) ---
export type { components, operations, paths } from './generated/openapi.types';
