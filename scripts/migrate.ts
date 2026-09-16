/** Applies drizzle/*.sql to whichever database is configured (see src/db/index.ts). */
import { getDb, usingD1, d1Raw } from '../src/db';

async function main() {
  const db = await getDb();
  if (usingD1()) {
    const { migrate } = await import('drizzle-orm/sqlite-proxy/migrator');
    await migrate(db, async (queries) => {
      // D1's HTTP API has no multi-call transaction, so statements run in order.
      for (const q of queries) await d1Raw(q);
    }, { migrationsFolder: './drizzle' });
  } else {
    const { migrate } = await import('drizzle-orm/libsql/migrator');
    await migrate(db as never, { migrationsFolder: './drizzle' });
  }
  console.log(`Migrations applied to ${usingD1() ? 'Cloudflare D1' : 'local SQLite (local.db)'}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
