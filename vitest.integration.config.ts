import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
    globalSetup: ['tests/integration/global-setup.ts'],
    // Prisma resuelve esta ruta desde prisma/schema.prisma, igual que la CLI:
    // las pruebas y `prisma migrate deploy` abren exactamente el mismo archivo.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
      JWT_ACCESS_SECRET: 'integration-secret-with-at-least-32-characters',
      CORS_ORIGINS: 'http://localhost:5173',
      LOG_LEVEL: 'silent',
    },
  },
});
