import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

/**
 * One SQLite schema, two places it lives.
 *
 * Production (DATABASE_TARGET=d1, set on Vercel) talks to Cloudflare D1 over
 * Cloudflare's HTTP API, so the app can run on Vercel with no socket to hold.
 *
 * Everywhere else it uses a local SQLite file (local.db) through libsql, so
 * development needs nothing installed and scripts can run alongside
 * `npm run dev`. To run a script against production, prefix it:
 *
 *   DATABASE_TARGET=d1 npm run db:setup
 */

/** Both drivers expose the same async drizzle API; the app is typed against the D1 one. */
type Db = SqliteRemoteDatabase<typeof schema>;

export const usingD1 = () => process.env.DATABASE_TARGET === 'd1';

function d1Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !databaseId || !token) {
    throw new Error(
      'DATABASE_TARGET=d1 needs CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_API_TOKEN.',
    );
  }
  return { accountId, databaseId, token };
}

type D1RawResponse = {
  success: boolean;
  errors?: { message: string }[];
  result?: { results?: { columns: string[]; rows: unknown[][] } }[];
};

/** Runs one statement on D1 and returns its rows as arrays, as drizzle's proxy driver expects. */
export async function d1Raw(sqlText: string, params: unknown[] = []): Promise<unknown[][]> {
  const { accountId, databaseId, token } = d1Config();
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql: sqlText, params }),
      cache: 'no-store',
    },
  );
  const data = (await res.json().catch(() => null)) as D1RawResponse | null;
  if (!res.ok || !data?.success) {
    const message = data?.errors?.map((e) => e.message).join('; ') || `D1 request failed (${res.status})`;
    throw new Error(message);
  }
  return data.result?.[0]?.results?.rows ?? [];
}

async function buildD1() {
  const { drizzle } = await import('drizzle-orm/sqlite-proxy');
  return drizzle(async (sqlText, params, method) => {
    const rows = await d1Raw(sqlText, params);
    // "get" wants the first row itself; everything else wants the list.
    return { rows: method === 'get' ? (rows[0] as unknown[]) : rows };
  }, { schema });
}

async function buildLocal() {
  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const client = createClient({ url: process.env.LOCAL_DATABASE_URL || 'file:local.db' });
  return drizzle(client, { schema });
}

let pending: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!pending) {
    pending = (usingD1() ? buildD1() : buildLocal()).then((db) => db as unknown as Db);
  }
  return pending;
}

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
