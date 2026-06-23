import { describe, expect, it } from 'vitest';

import {
  assertSeedAllowed,
  DEMO_CUSTOMER_ID,
  DEMO_TENANT_ID,
  resolveSeedConfig,
} from './config.js';
import { DEMO_CATEGORIES } from './demo-seed.js';

describe('resolveSeedConfig', () => {
  it('should provide stable demo defaults', () => {
    const config = resolveSeedConfig({});

    expect(config.tenantId).toBe(DEMO_TENANT_ID);
    expect(config.customerId).toBe(DEMO_CUSTOMER_ID);
    expect(config.adminEmail).toBe('admin@demo.supportflow.local');
    expect(config.agentEmail).toBe('agent@demo.supportflow.local');
    expect(config.customerEmail).toBe('customer@demo.supportflow.local');
    expect(config.adminPassword).toBe('DemoSupport123!');
  });

  it('should allow overriding credentials via env', () => {
    const config = resolveSeedConfig({
      SEED_DEMO_ADMIN_EMAIL: 'custom-admin@example.com',
      SEED_DEMO_ADMIN_PASSWORD: 'CustomPass123!',
      SEED_DEMO_DEFAULT_SLA_HOURS: '96',
    });

    expect(config.adminEmail).toBe('custom-admin@example.com');
    expect(config.adminPassword).toBe('CustomPass123!');
    expect(config.defaultSlaHours).toBe(96);
  });
});

describe('assertSeedAllowed', () => {
  it('should block production seed unless explicitly enabled', () => {
    expect(() =>
      assertSeedAllowed({
        NODE_ENV: 'production',
      }),
    ).toThrow(/SEED_DEMO_ENABLED=true/);

    expect(() =>
      assertSeedAllowed({
        NODE_ENV: 'production',
        SEED_DEMO_ENABLED: 'true',
      }),
    ).not.toThrow();
  });
});

describe('DEMO_CATEGORIES', () => {
  it('should define SLA policies per category', () => {
    expect(DEMO_CATEGORIES).toHaveLength(3);
    expect(DEMO_CATEGORIES.map((category) => category.slaHours)).toEqual([
      72, 48, 24,
    ]);
  });
});
