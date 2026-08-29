import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './tests/integration/database-url';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    globalSetup: ['tests/integration/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      JWT_ACCESS_SECRET: 'integration-secret-with-at-least-32-characters',
      CORS_ORIGINS: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
    },
  },
});
