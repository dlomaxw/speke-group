/**
 * Points every restaurant, bar and experience card at the page that describes
 * it, and records which property each restaurant and bar belongs to.
 *
 * Each link below was opened on 9 October 2026 and returns the page it claims
 * to. Where a property publishes nothing for a particular outlet — The Stables
 * and Lake Grill at Munyonyo — the card goes to that property's dining page
 * rather than somewhere that only looks close.
 *
 * The six experiences are group-wide (every spa, every gym, and so on), so they
 * carry no property and link to the Group's own page for that experience.
 *
 *   npx tsx scripts/apply-dining-links.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-dining-links.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { experiences, properties, restaurants } from '../src/db/schema';

/** slug: [owning property slug or null, the page that describes it] */
const DINING: Record<string, [string | null, string]> = {
  'nyanja': ['speke-resort-munyonyo', 'https://www.spekeresort.com/dining/nyanja-restaurant/'],
  'the-stables': ['speke-resort-munyonyo', 'https://www.spekeresort.com/dining/'],
  'lake-grill': ['speke-resort-munyonyo', 'https://www.spekeresort.com/dining/lake-terrace-restaurant/'],
  'pool-side-restaurant': ['speke-resort-munyonyo', 'https://www.spekeresort.com/dining/poolside-restaurant/'],
  'the-pub': ['kabira-country-club', 'https://kabiracountryclub.com/dining-3/pub/'],
  'la-cabana': ['speke-apartments-wampewo', 'https://www.spekeapartments.com/wampewo/'],
  'khyber-pass': ['speke-hotel', 'https://www.spekehotel.com/khyber-pass-restaurant/'],
  'viking-bar': ['speke-resort-munyonyo', 'https://www.spekeresort.com/dining/viking-bar/'],
  'rock-bar': ['speke-hotel', 'https://www.spekehotel.com/rock-bar/'],
  'forest-cottages-bar': ['forest-cottages-hotel', 'https://forest-cottages.com/bar/'],
  'heights-bar-cafe': ['bukoto-heights', 'https://bukotoheights.com/bar-cafe/'],
};

const EXPERIENCES: Record<string, string> = {
  'spas-and-salons': 'https://spekegroup.com/spas-and-salons/',
  'gyms': 'https://spekegroup.com/gyms/',
  'marina-experience': 'https://spekegroup.com/marina-experience/',
  'equestrian': 'https://spekegroup.com/equestrian/',
  'lakeside': 'https://spekegroup.com/lakeside/',
  'swimming-pools': 'https://spekegroup.com/swimming-pools/',
};

async function main() {
  const db = await getDb();
  console.log(`Applying dining and experience links to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const props = await db.select({ id: properties.id, slug: properties.slug }).from(properties);
  const idOf = (slug: string | null) => (slug ? props.find((p) => p.slug === slug)?.id ?? null : null);

  for (const [slug, [property, url]] of Object.entries(DINING)) {
    const propertyId = idOf(property);
    if (property && !propertyId) console.warn(`  ! no property "${property}"`);
    const res = await db.update(restaurants)
      .set({ propertyId, linkUrl: url, updatedAt: new Date() })
      .where(eq(restaurants.slug, slug))
      .returning({ id: restaurants.id });
    if (!res.length) console.warn(`  ! no restaurant "${slug}"`);
  }
  console.log(`  restaurants and bars linked: ${Object.keys(DINING).length}`);

  for (const [slug, url] of Object.entries(EXPERIENCES)) {
    const res = await db.update(experiences)
      .set({ linkUrl: url, updatedAt: new Date() })
      .where(eq(experiences.slug, slug))
      .returning({ id: experiences.id });
    if (!res.length) console.warn(`  ! no experience "${slug}"`);
  }
  console.log(`  experiences linked: ${Object.keys(EXPERIENCES).length}`);

  // The convention centre's old meetings link is a 404; its venues now live
  // on the centre's own site.
  await db.update(properties)
    .set({ websiteUrl: 'https://srcc-ug.com/', updatedAt: new Date() })
    .where(eq(properties.slug, 'speke-resort-convention-centre'));
  console.log('  convention centre website set to srcc-ug.com');

  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
