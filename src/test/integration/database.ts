import { execSync } from 'node:child_process';

import { prisma } from '../../shared/database/prisma.js';

const TEST_DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';

export { prisma as integrationPrisma };

export async function migrateTestDatabase(): Promise<void> {
  execSync('npx prisma db push --accept-data-loss', {
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
      ticket_histories,
      tickets,
      ticket_categories,
      customers,
      users,
      tenants
    RESTART IDENTITY CASCADE;
  `);
}

export async function disconnectTestDatabase(): Promise<void> {
  await prisma.$disconnect();
}
