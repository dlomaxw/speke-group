/** Applies drizzle/*.sql to whichever database is configured. */
import { getDb, usingPostgres } from '../src/db';

async function main() {
  const db = await getDb();
  if (usingPostgres()) {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db as never, { migrationsFolder: './drizzle' });
  } else {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(db as never, { migrationsFolder: './drizzle' });
  }
  console.log(`Migrations applied to ${usingPostgres() ? 'Postgres' : 'local PGlite'}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
