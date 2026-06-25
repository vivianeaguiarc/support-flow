# SupportFlow TypeScript SDK

Typed client for the SupportFlow API, generated from the OpenAPI specification.

> **Do not edit `openapi.types.ts` by hand.** It is auto-generated.
> Regenerate the whole SDK with `pnpm sdk:generate` from the backend root.

## Files

| File               | Source       | Description                                           |
| ------------------ | ------------ | ----------------------------------------------------- |
| `openapi.types.ts` | generated    | Types for paths, requests, responses, params, schemas |
| `client.ts`        | hand-written | Stable typed wrapper around `openapi-fetch`           |
| `index.ts`         | hand-written | Public entry point                                    |

## Usage

```ts
import { createSupportFlowClient } from './generated/sdk';

const api = createSupportFlowClient({
  baseUrl: 'https://api.supportflow.com/api/v1',
  accessToken: '<jwt>',
});

// Fully typed path, params, body and response:
const { data, error } = await api.GET('/auth/me');
if (error) {
  // typed ApiErrorResponse
} else {
  // data is typed
}

const created = await api.POST('/tickets', {
  body: {
    title: 'Cobrança indevida',
    description: 'Fui cobrado duas vezes no cartão',
    customerId: '550e8400-e29b-41d4-a716-446655440000',
  },
});
```

## Importing only the types

```ts
import type { components, paths } from './generated/sdk';

type Ticket = components['schemas']['Ticket'];
```
