/**
 * Puts the squash courts on the homepage in place of Kabira's gym card.
 *
 * The row already carried two gyms. This one is from
 * munyonyocommonwealth.com/leisure-wellness/wellness/squash/, read 9 October
 * 2026; the detail that there are two glass-backed courts, shared between the
 * two Munyonyo resorts, is from the wellness index page above it.
 *
 * Kabira's gym is retired rather than deleted. Note that it was the only
 * Kabira entry in this row, so the homepage location filter no longer offers
 * Kabira Country Club — bring the gym back from the dashboard, or add Kabira's
 * sauna, steam bath and pool as entries of their own, and it returns.
 *
 *   npx tsx scripts/apply-squash.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-squash.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, wellness } from '../src/db/schema';

const SQUASH = {
  slug: 'munyonyo-squash',
  name: 'Squash Courts',
  property: 'speke-resort-munyonyo',
  kind: 'squash' as const,
  location: 'Speke Resort Munyonyo and Munyonyo Commonwealth Resort',
  description:
    'Two glass-backed courts, shared between the two Munyonyo resorts. Squash is fast, indoors and an excellent cardiovascular workout — easy to learn, playable at any age, and adaptable in equipment and format to suit every size and skill level, whether you play for leisure or in earnest.',
  highlights: 'Two glass-backed courts · Singles and doubles · All ages and levels',
  imageUrl: '/images/l-squash.webp',
  imageAlt: 'A glass-backed squash court at Munyonyo',
  linkUrl: 'https://munyonyocommonwealth.com/leisure-wellness/wellness/squash/',
  sortOrder: 5,
};

async function main() {
  const db = await getDb();
  console.log(`Applying squash to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [p] = await db.select({ id: properties.id }).from(properties)
    .where(eq(properties.slug, SQUASH.property));
  if (!p) throw new Error(`no property "${SQUASH.property}"`);

  const { property, ...rest } = SQUASH;
  const row = { ...rest, propertyId: p.id, status: 'published' as const, updatedAt: new Date() };
  const [existing] = await db.select({ id: wellness.id }).from(wellness)
    .where(eq(wellness.slug, SQUASH.slug));
  if (existing) await db.update(wellness).set(row).where(eq(wellness.id, existing.id));
  else await db.insert(wellness).values(row);
  console.log(`  ${existing ? 'updated' : 'inserted'} ${SQUASH.slug}`);

  const retired = await db.update(wellness)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(wellness.slug, 'kabira-fitness'))
    .returning({ slug: wellness.slug });
  console.log(`  retired: ${retired.length ? retired[0].slug : 'nothing (already gone)'}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
