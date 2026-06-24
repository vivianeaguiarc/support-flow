import { DEFAULT_TENANT_ID } from '../../src/shared/constants/tenant.js';

export const DEMO_TENANT_ID = DEFAULT_TENANT_ID;
export const DEMO_CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_ADMIN_USER_ID = '00000000-0000-4000-8000-000000000010';
export const DEMO_AGENT_USER_ID = '00000000-0000-4000-8000-000000000011';

const DEFAULT_DEMO_PASSWORD = 'DemoSupport123!';

export type SeedConfig = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  defaultSlaHours: number;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  agentEmail: string;
  agentPassword: string;
  agentName: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
};

export function assertSeedAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === 'production' && env.SEED_DEMO_ENABLED !== 'true') {
    throw new Error(
      'Demo seed is disabled in production. Set SEED_DEMO_ENABLED=true to run explicitly.',
    );
  }
}

export function resolveSeedConfig(
  env: NodeJS.ProcessEnv = process.env,
): SeedConfig {
  return {
    tenantId: env.SEED_DEMO_TENANT_ID ?? DEMO_TENANT_ID,
    tenantName: env.SEED_DEMO_TENANT_NAME ?? 'SupportFlow Demo',
    tenantSlug: env.SEED_DEMO_TENANT_SLUG ?? 'demo',
    defaultSlaHours: Number(env.SEED_DEMO_DEFAULT_SLA_HOURS ?? 72),
    adminEmail: env.SEED_DEMO_ADMIN_EMAIL ?? 'admin@demo.supportflow.local',
    adminPassword: env.SEED_DEMO_ADMIN_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
    adminName: env.SEED_DEMO_ADMIN_NAME ?? 'Demo Admin',
    agentEmail: env.SEED_DEMO_AGENT_EMAIL ?? 'agent@demo.supportflow.local',
    agentPassword: env.SEED_DEMO_AGENT_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
    agentName: env.SEED_DEMO_AGENT_NAME ?? 'Demo Agent',
    customerId: env.SEED_DEMO_CUSTOMER_ID ?? DEMO_CUSTOMER_ID,
    customerEmail:
      env.SEED_DEMO_CUSTOMER_EMAIL ?? 'customer@demo.supportflow.local',
    customerName: env.SEED_DEMO_CUSTOMER_NAME ?? 'Demo Customer',
  };
}
