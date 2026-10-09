/**
 * Gives Kabira Country Club its own entries in the Experiences & Wellness row.
 *
 * Kabira's only entry there used to be a gym card with generic copy, and
 * retiring it in favour of the squash courts took Kabira out of the homepage
 * location filter altogether. These four put it back with more to show than it
 * had before: the gym, the pools, the sauna and steam bath, and the courts —
 * split into tennis, basketball and squash, each with its own photograph,
 * because one card could not show three different surfaces.
 *
 * Every line is from kabiracountryclub.com — /swimming-pool/,
 * /sauna-and-steam-bath/, /courts-2-2/, /best-gym/ and /fitness-classes/ —
 * read 9 October 2026, with each page's own photograph. The pool opening hours
 * are as published there; no membership rates are carried, because the club
 * changes them and its page is one click away.
 *
 * The gym keeps its original slug, so this replaces the retired row rather than
 * leaving a draft of the same thing behind it.
 *
 *   npx tsx scripts/apply-kabira-wellness.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-kabira-wellness.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, wellness } from '../src/db/schema';

const KB = 'https://kabiracountryclub.com';

const ENTRIES = [
  {
    slug: 'kabira-fitness',
    name: 'The Gym & Fitness Classes',
    kind: 'gym' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'A first-of-its-kind fitness facility in Uganda: cutting-edge equipment, a one-on-one personal training space and in-house nutritionists, alongside the half Olympic-sized outdoor pool. The health club runs classes for every need — spinning, Zumba and Sukuma among them.',
    highlights: 'Personal training · In-house nutritionists · Spinning · Zumba · Sukuma',
    imageUrl: '/images/l-kabira-gym.webp',
    imageAlt: 'The gym at Kabira Country Club',
    linkUrl: `${KB}/best-gym/`,
    sortOrder: 5,
  },
  {
    slug: 'kabira-pools',
    name: 'The Swimming Pools',
    kind: 'pool' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'Three pools — a baby pool, a kids’ pool and a half Olympic-sized pool — suitable for swimmers of every level and guests of all ages. Certified lifeguards are on duty, whether you are swimming lengths or simply lounging poolside.',
    highlights: 'Half Olympic-sized pool · Kids’ and baby pools · Lifeguards on duty',
    openingTimes: '06:00 – 19:00',
    imageUrl: '/images/l-kabira-pool.webp',
    imageAlt: 'The swimming pool at Kabira Country Club',
    linkUrl: `${KB}/swimming-pool/`,
    sortOrder: 6,
  },
  {
    slug: 'kabira-sauna',
    name: 'Sauna & Steam Bath',
    kind: 'spa' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'A sauna and steam bath for a proper sweat session — cooling and detoxing the body, adding gloss to the skin, and a way to unwind at the end of a day.',
    highlights: 'Sauna · Steam bath',
    imageUrl: '/images/l-kabira-sauna.webp',
    imageAlt: 'The sauna at Kabira Country Club',
    linkUrl: `${KB}/sauna-and-steam-bath/`,
    sortOrder: 7,
  },
  {
    slug: 'kabira-tennis',
    name: 'The Tennis Courts',
    kind: 'courts' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'Floodlit clay courts in the French Open mould, under the palms in Bukoto — playable into the evening, and the kind of surface that rewards a long rally.',
    highlights: 'Clay courts · Floodlit for evening play',
    imageUrl: '/images/l-kabira-tennis.webp',
    imageAlt: 'A clay tennis court at Kabira Country Club',
    linkUrl: `${KB}/courts-2-2/`,
    sortOrder: 8,
  },
  {
    slug: 'kabira-basketball',
    name: 'The Basketball Court',
    kind: 'courts' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'A full outdoor basketball court in the club grounds, painted and ringed by palms — somewhere to run off a morning before the heat sets in, or to get a game together after work.',
    highlights: 'Outdoor court · Open to members and guests',
    imageUrl: '/images/l-kabira-basketball.webp',
    imageAlt: 'The basketball court at Kabira Country Club',
    linkUrl: `${KB}/courts-2-2/`,
    sortOrder: 9,
  },
  {
    slug: 'kabira-courts',
    name: 'Squash Courts & Athletics Grounds',
    kind: 'courts' as const,
    location: 'Kabira Country Club, Bukoto',
    description:
      'Squash courts built to international standard, alongside track-and-field grounds — for anyone who would rather harmonise mind and body at some speed.',
    highlights: 'International-standard squash · Track and field',
    imageUrl: '/images/l-kabira-squash.webp',
    imageAlt: 'A squash court at Kabira Country Club',
    linkUrl: `${KB}/courts-2-2/`,
    sortOrder: 10,
  },
];

async function main() {
  const db = await getDb();
  console.log(`Applying Kabira wellness to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [p] = await db.select({ id: properties.id }).from(properties)
    .where(eq(properties.slug, 'kabira-country-club'));
  if (!p) throw new Error('no property "kabira-country-club"');

  for (const e of ENTRIES) {
    const row = { ...e, propertyId: p.id, status: 'published' as const, updatedAt: new Date() };
    const [existing] = await db.select({ id: wellness.id }).from(wellness)
      .where(eq(wellness.slug, e.slug));
    if (existing) await db.update(wellness).set(row).where(eq(wellness.id, existing.id));
    else await db.insert(wellness).values(row);
    console.log(`  ${existing ? 'updated' : 'inserted'} ${e.slug}`);
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
