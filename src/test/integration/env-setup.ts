const defaultTestDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';

const testDatabaseUrl =
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  defaultTestDatabaseUrl;

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL_TEST = testDatabaseUrl;
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_REFRESH_SECRET = 'integration-test-refresh-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
process.env.LOG_LEVEL = 'warn';
