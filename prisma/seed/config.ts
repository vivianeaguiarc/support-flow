import { DEFAULT_TENANT_ID } from '../../src/shared/constants/tenant.js';

export const DEMO_TENANT_ID = DEFAULT_TENANT_ID;
export const DEMO_TENANT_B_ID = '00000000-0000-0000-0000-000000000002';
export const DEMO_CATEGORY_SAC_ID = '00000000-0000-4000-8000-000000000003';
export const DEMO_CATEGORY_OUVIDORIA_ID =
  '00000000-0000-4000-8000-000000000004';
export const DEMO_CATEGORY_SUPORTE_ID = '00000000-0000-4000-8000-000000000005';
export const DEMO_ADMIN_USER_ID = '00000000-0000-4000-8000-000000000010';
export const DEMO_AGENT_USER_ID = '00000000-0000-4000-8000-000000000011';
export const DEMO_CUSTOMER_ID = '00000000-0000-4000-8000-000000000002';
export const DEMO_CUSTOMER_USER_ID = '00000000-0000-4000-8000-000000000012';
export const DEMO_TENANT_B_ADMIN_ID = '00000000-0000-4000-8000-000000000013';

export const DEFAULT_DEMO_PASSWORD = 'DemoSupport123!';

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
  customerUserEmail: string;
  customerUserPassword: string;
  customerUserName: string;
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
  const defaultPassword =
    env.SEED_DEMO_PASSWORD ??
    env.SEED_DEMO_ADMIN_PASSWORD ??
    DEFAULT_DEMO_PASSWORD;

  return {
    tenantId: env.SEED_DEMO_TENANT_ID ?? DEMO_TENANT_ID,
    tenantName: env.SEED_DEMO_TENANT_NAME ?? 'SupportFlow Demo',
    tenantSlug: env.SEED_DEMO_TENANT_SLUG ?? 'demo',
    defaultSlaHours: Number(env.SEED_DEMO_DEFAULT_SLA_HOURS ?? 72),
    adminEmail: env.SEED_DEMO_ADMIN_EMAIL ?? 'admin.demo@supportflow.com',
    adminPassword: env.SEED_DEMO_ADMIN_PASSWORD ?? defaultPassword,
    adminName: env.SEED_DEMO_ADMIN_NAME ?? 'Demo Admin',
    agentEmail: env.SEED_DEMO_AGENT_EMAIL ?? 'agent.demo@supportflow.com',
    agentPassword: env.SEED_DEMO_AGENT_PASSWORD ?? defaultPassword,
    agentName: env.SEED_DEMO_AGENT_NAME ?? 'Demo Agent',
    customerUserEmail:
      env.SEED_DEMO_CUSTOMER_USER_EMAIL ?? 'customer.demo@supportflow.com',
    customerUserPassword:
      env.SEED_DEMO_CUSTOMER_USER_PASSWORD ?? defaultPassword,
    customerUserName: env.SEED_DEMO_CUSTOMER_USER_NAME ?? 'Demo Customer User',
    customerId: env.SEED_DEMO_CUSTOMER_ID ?? DEMO_CUSTOMER_ID,
    customerEmail:
      env.SEED_DEMO_CUSTOMER_EMAIL ?? 'customer.demo@supportflow.com',
    customerName: env.SEED_DEMO_CUSTOMER_NAME ?? 'Demo Customer',
  };
}
