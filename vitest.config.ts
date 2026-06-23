import { defineConfig } from 'vitest/config';

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5433/supportflow_test?schema=public';
process.env.JWT_SECRET ??= 'unit-test-secret';
process.env.JWT_REFRESH_SECRET ??= 'unit-test-refresh-secret';
process.env.JWT_EXPIRES_IN ??= '1d';
process.env.JWT_REFRESH_EXPIRES_IN ??= '7d';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.integration.spec.ts'],
    setupFiles: ['src/test/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/**/services/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
    },
  },
});
