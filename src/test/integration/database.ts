import { execSync } from 'node:child_process';

import { featureFlagCache } from '../../modules/feature-flags/infrastructure/feature-flag-cache.js';
import { prisma } from '../../shared/database/prisma.js';

const defaultTestDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  defaultTestDatabaseUrl;

export { prisma as integrationPrisma };

export async function migrateTestDatabase(): Promise<void> {
  const command =
    process.env.CI === 'true'
      ? 'npx prisma migrate deploy'
      : 'npx prisma db push --accept-data-loss';

  execSync(command, {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
    stdio: 'inherit',
  });
}

export async function resetTestDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      notifications,
      ticket_attachments,
      ticket_comments,
      ticket_histories,
      refresh_tokens,
      feature_flag_audits,
      feature_flags,
      tickets,
      ticket_categories,
      customers,
      users,
      tenants
    RESTART IDENTITY CASCADE;
  `);

  featureFlagCache.clearForTests();
}

export async function disconnectTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}
