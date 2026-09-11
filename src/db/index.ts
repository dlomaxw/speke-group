import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/**
 * One database, two drivers.
 *
 * Production (and any environment with DATABASE_URL) talks to real Postgres.
 * Local development falls back to PGlite, which is Postgres compiled to wasm
 * and stored in .pglite/ — so the app runs and seeds with nothing to install.
 *
 * PGlite is STRICTLY SINGLE-PROCESS. Running a script (db:seed, db:migrate)
 * while `npm run dev` is up corrupts the store and every query then fails with
 * "RuntimeError: Aborted()". Stop the dev server first, or point DATABASE_URL
 * at a real Postgres, which has none of this restriction.
 */
/**
 * Both drivers expose the same drizzle query API, so the app is typed against
 * the postgres-js flavour. A union of the two would erase inference and force
 * `any` on every select.
 */
type Db = PostgresJsDatabase<typeof schema>;

function connectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''
  );
}

function buildPostgres(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require('postgres');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require('drizzle-orm/postgres-js');
  const client = postgres(url, {
    max: 1,                       // serverless: one socket per lambda
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: url.includes('localhost') ? false : 'require',
  });
  return drizzle(client, { schema });
}

async function buildPglite() {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const client = new PGlite('.pglite');
  return drizzle(client, { schema });
}

let cached: Db | null = null;
let pending: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached;
  if (pending) return pending;

  const url = connectionString();
  pending = (async () => {
    const db = url ? buildPostgres(url) : await buildPglite();
    cached = db as unknown as Db;
    return cached;
  })();
  return pending;
}

export const usingPostgres = () => Boolean(connectionString());
export { schema };

/**
 * Escape hatch for the config-driven admin screens, where the table is chosen
 * at runtime from COLLECTIONS and cannot be known to the type system. Confined
 * to those code paths; everything else uses the typed `getDb()`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDynamicDb(): Promise<any> {
  return getDb();
}
