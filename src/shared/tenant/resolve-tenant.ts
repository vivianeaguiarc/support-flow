import type { Request } from 'express';

import { env } from '../../config/env.js';
import { TENANT_ID_HEADER, TENANT_SLUG_HEADER } from './tenant-headers.js';

function readHeader(
  headers: Request['headers'],
  name: string,
): string | undefined {
  const value = headers[name];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value) && value.length > 0) {
    const trimmed = value[0]?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

export function extractTenantSubdomain(hostname: string): string | undefined {
  const baseDomain = env.TENANT_BASE_DOMAIN?.toLowerCase();
  if (!baseDomain) {
    return undefined;
  }

  const host = hostname.split(':')[0]?.toLowerCase();
  if (!host || host === baseDomain || host === `www.${baseDomain}`) {
    return undefined;
  }

  if (!host.endsWith(`.${baseDomain}`)) {
    return undefined;
  }

  const subdomain = host.slice(0, -(baseDomain.length + 1));
  if (!subdomain || subdomain.includes('.')) {
    return undefined;
  }

  return subdomain;
}

export type TenantResolutionHint = {
  tenantId?: string;
  tenantSlug?: string;
  source?: 'header_id' | 'header_slug' | 'subdomain';
};

export function resolveTenantHintFromRequest(
  req: Request,
): TenantResolutionHint {
  const tenantId = readHeader(req.headers, TENANT_ID_HEADER);
  if (tenantId) {
    return { tenantId, source: 'header_id' };
  }

  const tenantSlug = readHeader(req.headers, TENANT_SLUG_HEADER);
  if (tenantSlug) {
    return { tenantSlug, source: 'header_slug' };
  }

  const subdomain = extractTenantSubdomain(req.hostname);
  if (subdomain) {
    return { tenantSlug: subdomain, source: 'subdomain' };
  }

  return {};
}
