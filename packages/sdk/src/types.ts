/**
 * Convenience type aliases over the generated OpenAPI schemas.
 *
 * Frontends can import these instead of digging into
 * `components['schemas'][...]`. They are 100% derived from the generated
 * contract, so they stay in sync automatically after `pnpm sdk:generate`.
 */
import type { components } from './generated/openapi.types';

/** All schemas exposed by the API contract. */
export type Schemas = components['schemas'];

export type Ticket = Schemas['Ticket'];
export type TicketStatus = Schemas['TicketStatus'];
export type TicketPriority = Schemas['TicketPriority'];

export type AuthUser = Schemas['AuthUserResponse'];

export type PaginationMeta = Schemas['PaginationMeta'];
export type ApiError = Schemas['ApiErrorResponse'];
