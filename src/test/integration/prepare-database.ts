import { execSync } from 'node:child_process';

const databaseUrl =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';

const databaseExists = execSync(
  `docker exec supportflow-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'supportflow_test'"`,
  { encoding: 'utf8' },
).trim();

if (databaseExists !== '1') {
  execSync(
    `docker exec supportflow-postgres psql -U postgres -c "CREATE DATABASE supportflow_test;"`,
    { stdio: 'inherit' },
  );
}

execSync('npx prisma db push --accept-data-loss', {
  env: { ...process.env, DATABASE_URL: databaseUrl },
  stdio: 'inherit',
});

console.log('Test database is ready.');
