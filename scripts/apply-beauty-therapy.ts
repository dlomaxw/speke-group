/**
 * Puts Calabash Spa's beauty therapy on the homepage in place of the horse
 * riding card.
 *
 * The Pony Camp is already the Kids Activities card beside it, so the two were
 * describing the same thing twice. What the row had nothing of was the salon
 * side of the spa, which Calabash publishes in full.
 *
 * The text is from calabashspa.com/spa-treatment/#Beauty-Therapy, read 9
 * October 2026 — natural facials, waxing, threading and the nail bar. No prices
 * are carried here: the spa changes them, and its own page is one click away.
 *
 * The horse riding row is retired rather than deleted, so the dashboard can
 * bring it back.
 *
 *   npx tsx scripts/apply-beauty-therapy.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-beauty-therapy.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, settings, wellness } from '../src/db/schema';

const BEAUTY = {
  slug: 'calabash-beauty-therapy',
  name: 'Beauty Therapy at Calabash Spa',
  property: 'speke-resort-munyonyo',
  kind: 'salon' as const,
  location: 'Calabash Spa, Speke Resort Munyonyo',
  description:
    'Natural facials and beauty treatments at Calabash Spa — waxing, threading and brow shaping, a nail bar for manicures and pedicures, and a kids’ nail bar alongside. In the spa’s own words, they delight in unveiling the beauty that lies within.',
  highlights: 'Natural facials · Waxing · Threading · Mani & pedi · Kids nail bar',
  imageUrl: '/images/l-beauty-therapy.webp',
  imageAlt: 'Beauty treatment at Calabash Spa',
  linkUrl: 'https://calabashspa.com/spa-treatment/#Beauty-Therapy',
  sortOrder: 4,
};

async function main() {
  const db = await getDb();
  console.log(`Applying beauty therapy to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [p] = await db.select({ id: properties.id }).from(properties)
    .where(eq(properties.slug, BEAUTY.property));
  if (!p) throw new Error(`no property "${BEAUTY.property}"`);

  const { property, ...rest } = BEAUTY;
  const row = { ...rest, propertyId: p.id, status: 'published' as const, updatedAt: new Date() };
  const [existing] = await db.select({ id: wellness.id }).from(wellness)
    .where(eq(wellness.slug, BEAUTY.slug));
  if (existing) await db.update(wellness).set(row).where(eq(wellness.id, existing.id));
  else await db.insert(wellness).values(row);
  console.log(`  ${existing ? 'updated' : 'inserted'} ${BEAUTY.slug}`);

  /* The row's own introduction still advertised horse riding, which is no
     longer one of its cards. */
  await db.update(settings)
    .set({
      value: 'Spas and salons, gyms and pools, beauty therapy and things for children to do — choose a location to see what is on offer there.',
      updatedAt: new Date(),
    })
    .where(eq(settings.key, 'wellness_body'));
  console.log('  section introduction updated');

  const retired = await db.update(wellness)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(eq(wellness.slug, 'munyonyo-equestrian'))
    .returning({ slug: wellness.slug });
  console.log(`  retired: ${retired.length ? retired[0].slug : 'nothing (already gone)'}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
