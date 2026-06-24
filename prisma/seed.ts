import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { assertSeedAllowed, resolveSeedConfig } from './seed/config.js';
import { seedDemoData } from './seed/demo-seed.js';

async function main(): Promise<void> {
  assertSeedAllowed();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required to run the demo seed. Copy .env.example to .env and configure the database URL.',
    );
  }

  const config = resolveSeedConfig();
  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const result = await seedDemoData(prisma, config);

    console.log('Demo seed completed successfully.');
    console.log('');
    console.log('Tenant A');
    console.log(`  id:   ${result.tenantId}`);
    console.log(`  slug: ${result.tenantSlug}`);
    console.log('');
    console.log('Tenant B');
    console.log(`  id:   ${result.secondaryTenantId}`);
    console.log(`  slug: ${result.secondaryTenantSlug}`);
    console.log(`  admin: admin.demo-b@supportflow.com`);
    console.log('');
    console.log('Users (login via POST /api/v1/auth/login)');
    console.log(`  admin:    ${result.adminEmail}`);
    console.log(`  agent:    ${result.agentEmail}`);
    console.log(`  customer: ${result.customerUserEmail}`);
    console.log(`  password: ${config.adminPassword}`);
    console.log('');
    console.log('Customer entity (use as customerId when opening tickets)');
    console.log(`  id:    ${result.customerId}`);
    console.log(`  email: ${result.customerEmail}`);
    console.log('');
    console.log('Ticket categories');
    for (const name of result.categoryNames) {
      console.log(`  - ${name}`);
    }
    console.log('');
    console.log(`Demo tickets (${result.ticketProtocols.length})`);
    for (const protocol of result.ticketProtocols) {
      console.log(`  - ${protocol}`);
    }
    console.log('');
    console.log(
      `Interactions: ${result.commentCount} comments, ${result.notificationCount} notifications`,
    );
    console.log('');
    console.log('Swagger (local): http://localhost:3000/api/docs');
    console.log(
      'Swagger (production): https://support-flow-uath.onrender.com/api/docs/',
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Demo seed failed.');
  console.error(error);
  process.exit(1);
});
