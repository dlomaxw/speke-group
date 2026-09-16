import type { Config } from 'drizzle-kit';

/** Generates SQLite migrations; they apply to both D1 and the local file. */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  verbose: true,
  strict: false,
} satisfies Config;
