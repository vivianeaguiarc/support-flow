# @supportflow/sdk

Typed TypeScript SDK for the **SupportFlow API**, generated from the backend's
OpenAPI specification. Provides a fully-typed HTTP client plus ergonomic,
resource-oriented APIs (`TicketsApi`, `AuthApi`) for any frontend.

- ✅ End-to-end types (paths, params, query, body, responses)
- ✅ ESM + CommonJS + `.d.ts` declarations
- ✅ Zero hand-written request code — regenerated from the contract

## Architecture

```
packages/sdk/
  src/
    generated/
      openapi.types.ts   # AUTO-GENERATED from docs/openapi.json (do not edit)
    apis/
      tickets.api.ts     # TicketsApi (high-level)
      auth.api.ts        # AuthApi (high-level)
    client.ts            # low-level typed openapi-fetch wrapper
    types.ts             # convenience type aliases (Ticket, AuthUser, ...)
    sdk.ts               # createSupportFlowSdk() factory
    index.ts             # public exports
  package.json
  tsconfig.json
  tsup.config.ts         # build: ESM + CJS + d.ts
```

Generated code (`src/generated`) is kept strictly separate from the manual code
(`client.ts`, `apis/`, `types.ts`, `sdk.ts`).

## Installation

The package is part of the SupportFlow monorepo (`packages/sdk`). In a frontend
within the workspace:

```jsonc
// frontend package.json
{
  "dependencies": {
    "@supportflow/sdk": "workspace:*",
  },
}
```

Once published to a registry, install it the usual way:

```bash
pnpm add @supportflow/sdk
```

## Configuration & authentication

```ts
import { createSupportFlowSdk } from '@supportflow/sdk';

const sdk = createSupportFlowSdk({
  baseUrl: 'https://api.supportflow.com/api/v1',
  accessToken: '<jwt>', // sent as Authorization: Bearer <jwt>
  // apiKey: 'supportflow_sk_live_...', // for external integrations (x-api-key)
});
```

## Usage

### Resource APIs (recommended)

```ts
import { TicketsApi, createSupportFlowClient } from '@supportflow/sdk';

const client = createSupportFlowClient({ accessToken: token });
const tickets = new TicketsApi(client);

const { data, error } = await tickets.list({
  params: { query: { status: 'OPEN', page: 1, limit: 20 } },
});

const detail = await tickets.getById('550e8400-e29b-41d4-a716-446655440000');

await tickets.updateStatus(id, { body: { status: 'RESOLVED' } });
await tickets.assign(id, { body: { assignedToId: agentId } });
```

Or via the factory:

```ts
import { createSupportFlowSdk } from '@supportflow/sdk';

const sdk = createSupportFlowSdk({ accessToken: token });
const me = await sdk.auth.me();
const list = await sdk.tickets.list();
```

### Low-level client (any endpoint)

```ts
import { createSupportFlowClient } from '@supportflow/sdk';

const client = createSupportFlowClient({ accessToken: token });
const { data, error } = await client.GET('/auth/me');
```

### Types only

```ts
import type { Ticket, AuthUser, PaginationMeta } from '@supportflow/sdk';
// or the raw generated contract:
import type { components, paths } from '@supportflow/sdk';
```

## Build & regeneration

From the backend root:

```bash
pnpm sdk:generate   # export OpenAPI + regenerate src/generated/openapi.types.ts
pnpm sdk:build      # build ESM + CJS + d.ts into packages/sdk/dist
pnpm sdk:verify     # regenerate + typecheck + build + assert no drift
```

> Never edit `src/generated/openapi.types.ts` by hand. Change the API + its
> Swagger docs, then run `pnpm sdk:generate`.
