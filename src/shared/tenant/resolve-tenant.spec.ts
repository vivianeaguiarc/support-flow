import { describe, expect, it } from 'vitest';

import { env } from '../../config/env.js';
import {
  extractTenantSubdomain,
  resolveTenantHintFromRequest,
} from './resolve-tenant.js';

describe('resolveTenantHintFromRequest', () => {
  it('reads tenant id from x-tenant-id header', () => {
    const hint = resolveTenantHintFromRequest({
      headers: { 'x-tenant-id': 'tenant-123' },
      hostname: 'localhost',
    } as never);

    expect(hint).toEqual({
      tenantId: 'tenant-123',
      source: 'header_id',
    });
  });

  it('reads tenant slug from x-tenant-slug header', () => {
    const hint = resolveTenantHintFromRequest({
      headers: { 'x-tenant-slug': 'acme' },
      hostname: 'localhost',
    } as never);

    expect(hint).toEqual({
      tenantSlug: 'acme',
      source: 'header_slug',
    });
  });
});

describe('extractTenantSubdomain', () => {
  it('extracts subdomain when TENANT_BASE_DOMAIN is configured', () => {
    const original = env.TENANT_BASE_DOMAIN;
    (env as { TENANT_BASE_DOMAIN?: string }).TENANT_BASE_DOMAIN =
      'supportflow.com';

    expect(extractTenantSubdomain('acme.supportflow.com')).toBe('acme');

    (env as { TENANT_BASE_DOMAIN?: string }).TENANT_BASE_DOMAIN = original;
  });
});
