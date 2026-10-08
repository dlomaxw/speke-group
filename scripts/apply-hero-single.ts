/**
 * Keeps the Group's own panel on the hero and retires the per-property ones.
 * They are set to draft rather than deleted, so turning them back on is a
 * status change in the dashboard.
 *
 *   npx tsx scripts/apply-hero-single.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-hero-single.ts
 */
import { ne } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { heroSlides } from '../src/db/schema';

async function main() {
  const db = await getDb();
  console.log(`Trimming the hero on ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);
  const res = await db.update(heroSlides)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(ne(heroSlides.slug, 'the-group'))
    .returning({ slug: heroSlides.slug });
  console.log(`  retired ${res.length} property panels; "the-group" stays published.`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
