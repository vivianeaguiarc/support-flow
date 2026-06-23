process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';
process.env.DATABASE_URL_TEST =
  process.env.DATABASE_URL_TEST ??
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_EXPIRES_IN = '1d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
