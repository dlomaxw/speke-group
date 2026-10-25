/**
 * Moves the marina and the equestrian centre into Experiences & Wellness.
 *
 * They used to have a Leisure band of their own below that row, which is now
 * gone from the homepage. Rather than create new records, this brings back the
 * two wellness rows that were retired when the band made them redundant —
 * munyonyo-marina and munyonyo-equestrian — and gives them the band's own copy,
 * photographs and links, so nothing is duplicated and nothing is orphaned.
 *
 * Both sit at the end of the row: the spas, gyms and pools come first, and the
 * things to do out on the lake and in the paddock follow.
 *
 *   npx tsx scripts/apply-leisure-into-wellness.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-leisure-into-wellness.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, wellness } from '../src/db/schema';

const ENTRIES = [
  {
    slug: 'munyonyo-marina',
    name: 'Marina Experience',
    kind: 'marina' as const,
    location: 'Speke Resort Munyonyo, Lake Victoria',
    description:
      'Speke Resort Munyonyo and Munyonyo Commonwealth Resort share the largest privately owned marina in Uganda, offering boat cruises, water safaris and fishing excursions.',
    highlights: 'Fishing · Bird watching · Boat trips · Trips to islands',
    imageUrl: '/images/l-marina.webp',
    imageAlt: 'Boats at the Munyonyo marina',
    linkUrl: 'https://spekegroup.com/marina-experience/',
    sortOrder: 11,
  },
  {
    slug: 'munyonyo-equestrian',
    name: 'Equestrian',
    kind: 'equestrian' as const,
    location: 'Speke Resort Munyonyo',
    description:
      'The Pony Camp is for children aged 6 to 17, from beginners to advanced riders, with show-quality ponies, experienced year-round trainers and a small teacher-to-student ratio.',
    highlights: 'Pony camp · Pony rides · Grooming and horsemanship',
    imageUrl: '/images/l-equestrian.webp',
    imageAlt: 'Ponies at the equestrian centre',
    linkUrl: 'https://spekegroup.com/equestrian/',
    sortOrder: 12,
  },
];

async function main() {
  const db = await getDb();
  console.log(`Moving leisure into wellness on ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [p] = await db.select({ id: properties.id }).from(properties)
    .where(eq(properties.slug, 'speke-resort-munyonyo'));
  if (!p) throw new Error('no property "speke-resort-munyonyo"');

  for (const e of ENTRIES) {
    const row = { ...e, propertyId: p.id, status: 'published' as const, updatedAt: new Date() };
    const [existing] = await db.select({ id: wellness.id }).from(wellness)
      .where(eq(wellness.slug, e.slug));
    if (existing) await db.update(wellness).set(row).where(eq(wellness.id, existing.id));
    else await db.insert(wellness).values(row);
    console.log(`  ${existing ? 'republished' : 'inserted'} ${e.slug}`);
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
