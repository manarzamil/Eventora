import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
    setupFiles: ['tests/setup.ts'],
    // Integration tests share one PostgreSQL database and truncate between
    // suites, so files must not run in parallel with each other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` throws by design when imported outside a React Server
      // Component. Under Vitest the services ARE the unit under test, so the
      // guard is stubbed out rather than removed from the source.
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
});
