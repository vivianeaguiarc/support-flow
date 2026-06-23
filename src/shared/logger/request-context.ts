import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
  method?: string;
  path?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

export function getRequestId(req?: { id?: unknown }): string | undefined {
  const fromContext = getRequestContext()?.requestId;
  if (fromContext) {
    return fromContext;
  }

  const requestId = req?.id;
  if (requestId === undefined || requestId === null) {
    return undefined;
  }

  if (typeof requestId === 'string' || typeof requestId === 'number') {
    return String(requestId);
  }

  return undefined;
}
