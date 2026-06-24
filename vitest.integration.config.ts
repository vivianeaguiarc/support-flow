import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    setupFiles: [
      'src/test/integration/env-setup.ts',
      'src/test/integration/register-event-handlers.ts',
    ],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 60_000,
  },
});
