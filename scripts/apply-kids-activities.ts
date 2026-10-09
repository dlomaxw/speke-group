/**
 * Puts Kids Activities on the homepage in place of the marina card.
 *
 * The marina already has its own card in the Leisure band further down the
 * page, so it was saying the same thing twice. What the Spa & Wellness row did
 * not have was anything for children, which the resort publishes a page for.
 *
 * The text below is what munyonyocommonwealth.com/leisure-wellness/wellness/
 * kids-activities/ says, read 9 October 2026: the Pony Camp, and the weekend
 * and public-holiday activities at the Lakeside and the Olympic pool.
 *
 * The marina row is retired rather than deleted, so it can be brought back
 * from the dashboard.
 *
 *   npx tsx scripts/apply-kids-activities.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-kids-activities.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, wellness } from '../src/db/schema';

const KIDS = {
  slug: 'munyonyo-kids-activities',
  name: 'Kids Activities',
  property: 'speke-resort-munyonyo',
  kind: 'kids' as const,
  location: 'Speke Resort Munyonyo, Lake Victoria',
  description:
    'The Pony Camp takes children aged 6 to 17, from beginners to advanced riders, with show-quality ponies and year-round trainers. At weekends and on public holidays there is face painting, kite flying and jumping castles at the Lakeside, and water slides at the Olympic pool, watched over by qualified lifesavers.',
  highlights: 'Pony Camp · Face painting · Kite flying · Jumping castles · Water slides',
  imageUrl: '/images/l-kids.webp',
  imageAlt: 'Children riding at the Pony Camp',
  sortOrder: 3,
};

async function main() {
  const db = await getDb();
  console.log(`Applying kids activities to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [p] = await db.select({ id: properties.id }).from(properties)
    .where(eq(properties.slug, KIDS.property));
  if (!p) throw new Error(`no property "${KIDS.property}"`);

  const { property, ...rest } = KIDS;
  const row = { ...rest, propertyId: p.id, status: 'published' as const, updatedAt: new Date() };
  const [existing] = await db.select({ id: wellness.id }).from(wellness)
    .where(eq(wellness.slug, KIDS.slug));
  if (existing) await db.update(wellness).set(row).where(eq(wellness.id, existing.id));
  else await db.insert(wellness).values(row);
  console.log(`  ${existing ? 'updated' : 'inserted'} ${KIDS.slug}`);

  const retired = await db.update(wellness)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(wellness.slug, 'munyonyo-marina'))
    .returning({ slug: wellness.slug });
  console.log(`  retired: ${retired.length ? retired[0].slug : 'nothing (already gone)'}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
