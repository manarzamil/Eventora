/**
 * Drops and recreates the public schema, then re-applies migrations.
 * Destructive by design — refuses to run against a production database.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset the database with NODE_ENV=production.');
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');

  const client = postgres(url, { max: 1 });
  const database = drizzle(client);

  console.log('→ dropping schema…');
  await database.execute(sql`drop schema if exists public cascade`);
  await database.execute(sql`create schema public`);

  console.log('→ re-applying migrations…');
  await migrate(database, { migrationsFolder: './drizzle' });

  console.log('✔ database reset');
  await client.end();
}

main().catch((error) => {
  console.error('✖ reset failed');
  console.error(error);
  process.exit(1);
});
