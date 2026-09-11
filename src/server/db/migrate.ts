/**
 * Applies every pending SQL migration in ./drizzle to the configured database.
 * Used by `npm run db:migrate` locally and by the deploy pipeline in CI.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = (process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL);
  if (!url) throw new Error('DATABASE_URL is not set.');

  // A dedicated single-connection client: migrations must run serially.
  const client = postgres(url, { max: 1 });
  const database = drizzle(client);

  console.log('→ applying migrations…');
  await migrate(database, { migrationsFolder: './drizzle' });
  console.log('✔ migrations applied');

  await client.end();
}

main().catch((error) => {
  console.error('✖ migration failed');
  console.error(error);
  process.exit(1);
});
