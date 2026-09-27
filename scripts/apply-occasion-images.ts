/**
 * Gives the two "occasions" blocks the photos the homepage cards show.
 *
 *   npx tsx scripts/apply-occasion-images.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-occasion-images.ts
 */
import { and, eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { highlightBlocks } from '../src/db/schema';

const PHOTOS = [
  { name: 'Meetings', imageUrl: '/images/v-victoria.webp', imageAlt: 'The Victoria Ballroom set for a conference' },
  { name: 'Weddings', imageUrl: '/images/v-kabira-ballroom.webp', imageAlt: 'The Kabira Ballroom dressed for a celebration' },
];

async function main() {
  const db = await getDb();
  console.log(`Applying occasion photos to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);
  for (const p of PHOTOS) {
    const res = await db.update(highlightBlocks)
      .set({ imageUrl: p.imageUrl, imageAlt: p.imageAlt, updatedAt: new Date() })
      .where(and(eq(highlightBlocks.section, 'occasions'), eq(highlightBlocks.name, p.name)))
      .returning({ id: highlightBlocks.id });
    console.log(`  ${p.name}: ${res.length} updated`);
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
