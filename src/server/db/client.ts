import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/server/db/schema';

/**
 * A single pooled connection shared across the process.
 *
 * Next.js hot-reloads server modules in development, which would otherwise open
 * a new pool on every edit until PostgreSQL runs out of connections. Caching the
 * client on `globalThis` survives the reload.
 */
declare global {
  var __eventoraSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const connectionString = (process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL);
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
  }
  return postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idle_timeout: 20,
    // Return `numeric` as string rather than a lossy JS number.
    types: {},
  });
}

export const sql = globalThis.__eventoraSql ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__eventoraSql = sql;
}

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
