import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { assertSeedAllowed, resolveSeedConfig } from './seed/config.js';
import { seedDemoData } from './seed/demo-seed.js';
import { resetDemoData } from './seed/reset-demo.js';

async function main(): Promise<void> {
  assertSeedAllowed();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required to reset demo data. Copy .env.example to .env and configure the database URL.',
    );
  }

  const config = resolveSeedConfig();
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log(`Resetting demo tenant (${config.tenantId})...`);
    await resetDemoData(prisma, config.tenantId);

    const result = await seedDemoData(prisma, config);

    console.log('Demo reset completed successfully.');
    console.log('');
    console.log('Tenant');
    console.log(`  id:   ${result.tenantId}`);
    console.log(`  slug: ${result.tenantSlug}`);
    console.log('');
    console.log('Users');
    console.log(`  admin:    ${result.adminEmail}`);
    console.log(`  agent:    ${result.agentEmail}`);
    console.log(`  customer: ${result.customerUserEmail}`);
    console.log(`  password: ${config.adminPassword}`);
    console.log('');
    console.log(`Tickets recreated: ${result.ticketProtocols.length}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Demo reset failed.');
  console.error(error);
  process.exit(1);
});
