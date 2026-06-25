/**
 * High-level, resource-oriented API for tickets.
 *
 * Wraps the low-level `openapi-fetch` client with ergonomic methods while
 * keeping full end-to-end typing (params, query, body and responses are all
 * inferred from the generated OpenAPI contract).
 */
import type { MaybeOptionalInit } from 'openapi-fetch';

import type { SupportFlowApiClient } from '../client';
import type { paths } from '../generated/openapi.types';

type Init<P extends keyof paths, M extends keyof paths[P]> = MaybeOptionalInit<
  paths[P],
  M
>;

/** Options without the path params, which are passed as explicit arguments. */
type InitWithoutParams<P extends keyof paths, M extends keyof paths[P]> = Omit<
  NonNullable<Init<P, M>>,
  'params'
>;

export class TicketsApi {
  constructor(private readonly client: SupportFlowApiClient) {}

  /** List tickets (paginated, with filters/search/sort via `params.query`). */
  list(init?: Init<'/tickets', 'get'>) {
    return this.client.GET('/tickets', init);
  }

  /** Create a new ticket. */
  create(init: Init<'/tickets', 'post'>) {
    return this.client.POST('/tickets', init);
  }

  /** Aggregated ticket summary (counts by status/priority). */
  summary(init?: Init<'/tickets/summary', 'get'>) {
    return this.client.GET('/tickets/summary', init);
  }

  /** Ticket operational metrics. */
  metrics(init?: Init<'/tickets/metrics', 'get'>) {
    return this.client.GET('/tickets/metrics', init);
  }

  /** Fetch a single ticket by id. */
  getById(id: string, init?: InitWithoutParams<'/tickets/{id}', 'get'>) {
    return this.client.GET('/tickets/{id}', {
      ...init,
      params: { path: { id } },
    });
  }

  /** Change a ticket status. */
  updateStatus(
    id: string,
    init: InitWithoutParams<'/tickets/{id}/status', 'patch'>,
  ) {
    return this.client.PATCH('/tickets/{id}/status', {
      ...init,
      params: { path: { id } },
    });
  }

  /** Assign (or reassign) a ticket to an agent. */
  assign(id: string, init: InitWithoutParams<'/tickets/{id}/assign', 'patch'>) {
    return this.client.PATCH('/tickets/{id}/assign', {
      ...init,
      params: { path: { id } },
    });
  }

  /** Read the audit/history trail of a ticket. */
  history(
    id: string,
    init?: InitWithoutParams<'/tickets/{id}/history', 'get'>,
  ) {
    return this.client.GET('/tickets/{id}/history', {
      ...init,
      params: { path: { id } },
    });
  }
}
