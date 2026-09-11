/**
 * Global test setup.
 *
 * Integration tests run against a REAL PostgreSQL database — the same engine as
 * production, not an in-memory substitute — because the behaviour under test
 * (transactions, conditional updates, unique indexes, LATERAL joins) is
 * precisely the behaviour a fake would not reproduce.
 *
 * `TEST_DATABASE_URL` is copied over `DATABASE_URL` before any application
 * module loads, so the app's own connection helper points at the test database
 * without needing a test-specific code path.
 */
import 'dotenv/config';
import { beforeAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Copy .env.example to .env — the suite refuses to run ' +
      'without a dedicated test database, because it truncates every table.',
  );
}

// NODE_ENV is already 'test' — Vitest sets it before this file is evaluated.
process.env.DATABASE_URL = testUrl;
process.env.AUTH_SECRET ??= 'test-secret-value-that-is-long-enough-0123456789';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';

beforeAll(async () => {
  const client = postgres(testUrl, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  await client.end();
});
